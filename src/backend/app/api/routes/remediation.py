"""
NETRA Remediation Simulator & Safe Change Control Routes
Workflow: Finding -> Fix Preview -> Simulation -> Validation -> Approval
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import RemediationPlan
from app.services.remediation_engine import simulate_remediation, validate_remediation

router = APIRouter()


@router.get("", response_model=List[RemediationPlan])
async def list_remediations(status: Optional[str] = None, device_id: Optional[str] = None):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if device_id:
        query["device_id"] = device_id

    plans = await db.remediation.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return plans


@router.get("/{remediation_id}", response_model=RemediationPlan)
async def get_remediation_plan(remediation_id: str):
    db = get_db()
    plan = await db.remediation.find_one({"remediation_id": remediation_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Remediation plan not found")
    return plan


@router.post("/{remediation_id}/simulate")
async def run_simulation(remediation_id: str):
    """Simulate applying changes without touching real network devices"""
    db = get_db()
    plan_dict = await db.remediation.find_one({"remediation_id": remediation_id})
    if not plan_dict:
        raise HTTPException(status_code=404, detail="Remediation plan not found")

    plan = RemediationPlan(**plan_dict)
    sim_result = simulate_remediation(plan)

    await db.remediation.update_one(
        {"remediation_id": remediation_id},
        {"$set": {
            "status": "simulated",
            "simulation_result": sim_result["simulation_output"]
        }}
    )

    return {
        "remediation_id": remediation_id,
        **sim_result
    }


@router.post("/{remediation_id}/validate")
async def run_validation(remediation_id: str):
    """Validate that remediation adheres to compliance and does not introduce security regression"""
    db = get_db()
    plan_dict = await db.remediation.find_one({"remediation_id": remediation_id})
    if not plan_dict:
        raise HTTPException(status_code=404, detail="Remediation plan not found")

    plan = RemediationPlan(**plan_dict)
    val_result = validate_remediation(plan)

    await db.remediation.update_one(
        {"remediation_id": remediation_id},
        {"$set": {
            "status": "validated" if val_result["status"] == "passed" else "simulation_failed",
            "validation_result": val_result["validation_output"]
        }}
    )

    return {
        "remediation_id": remediation_id,
        **val_result
    }


@router.post("/{remediation_id}/approve")
async def approve_plan(remediation_id: str, approver: str = "SOC-Lead-Auditor"):
    """
    Mark remediation plan as approved for staged maintenance window deployment.
    Never automatically applies without explicit human approval.
    """
    db = get_db()
    plan = await db.remediation.find_one({"remediation_id": remediation_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Remediation plan not found")

    await db.remediation.update_one(
        {"remediation_id": remediation_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.utcnow(),
            "approved_by": approver
        }}
    )

    # Also update associated finding status to remediated/in_progress
    if plan.get("finding_id"):
        await db.findings.update_one(
            {"finding_id": plan["finding_id"]},
            {"$set": {"status": "in_progress", "updated_at": datetime.utcnow()}}
        )

    return {
        "status": "success",
        "message": f"Remediation plan {remediation_id} approved by {approver}",
        "approved_at": datetime.utcnow().isoformat()
    }
