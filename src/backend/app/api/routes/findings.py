"""
NETRA Findings & Evidence Routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import Finding, FindingUpdate
from app.services.ai_service import explain_finding_ai

router = APIRouter()


@router.get("", response_model=List[Finding])
async def list_findings(
    severity: Optional[str] = None,
    framework: Optional[str] = None,
    device_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    db = get_db()
    query = {}
    if severity:
        query["severity"] = severity
    if framework:
        query["framework"] = framework
    if device_id:
        query["device_id"] = device_id
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"control_id": {"$regex": search, "$options": "i"}}
        ]

    cursor = db.findings.find(query, {"_id": 0}).sort("risk_score", -1).limit(limit)
    findings = await cursor.to_list(length=limit)
    return findings


@router.get("/{finding_id}")
async def get_finding(finding_id: str):
    db = get_db()
    finding = await db.findings.find_one({"finding_id": finding_id}, {"_id": 0})
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    # Get associated device info
    device = await db.devices.find_one({"device_id": finding.get("device_id")}, {"_id": 0})
    remediation = await db.remediation.find_one({"finding_id": finding_id}, {"_id": 0})

    return {
        "finding": finding,
        "device": device,
        "remediation_plan": remediation
    }


@router.patch("/{finding_id}")
async def update_finding(finding_id: str, payload: FindingUpdate):
    db = get_db()
    update_data = {}
    if payload.status:
        update_data["status"] = payload.status
    if payload.false_positive_reason:
        update_data["false_positive_reason"] = payload.false_positive_reason
    update_data["updated_at"] = datetime.utcnow()

    res = await db.findings.update_one({"finding_id": finding_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Finding not found")

    updated = await db.findings.find_one({"finding_id": finding_id}, {"_id": 0})
    return updated


@router.post("/{finding_id}/ai-explain")
async def ai_explain_finding(finding_id: str):
    """Generate plain English AI explanation and attack narrative for a finding"""
    db = get_db()
    finding = await db.findings.find_one({"finding_id": finding_id}, {"_id": 0})
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    explanation = await explain_finding_ai(
        title=finding.get("title", ""),
        control_id=finding.get("control_id", ""),
        config_evidence=finding.get("config_evidence", ""),
        vendor=finding.get("vendor", "")
    )

    return {
        "finding_id": finding_id,
        "title": finding.get("title"),
        **explanation
    }
