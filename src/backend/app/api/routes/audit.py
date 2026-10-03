"""
NETRA Audit Execution Routes
Executes end-to-end pipeline: Ingestion -> Parsing -> NSIR -> Compliance -> Risk -> Remediations
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import time

from app.core.database import get_db
from app.models.models import (
    Audit, AuditCreate, AuditStatusEnum, FrameworkEnum, VendorEnum, generate_id
)
from app.services.vendor_detector import detect_vendor
from app.services.sanitizer import sanitize_config
from app.services.config_parser import parse_config
from app.services.compliance_engine import (
    run_compliance_checks, calculate_compliance_score, calculate_risk_score
)
from app.services.remediation_engine import generate_remediation_plan, simulate_remediation, validate_remediation

router = APIRouter()


@router.post("/execute", response_model=Audit)
async def execute_audit(payload: AuditCreate):
    """
    Run end-to-end configuration audit synchronously.
    Takes raw configuration, performs sanitization, NSIR normalization,
    compliance evaluation, and stores all findings and remediation plans.
    """
    start_time = time.time()
    db = get_db()
    
    if not payload.raw_config.strip():
        raise HTTPException(status_code=400, detail="Configuration cannot be empty")

    # 1. Sanitize
    sanitized_config, redactions = sanitize_config(payload.raw_config)

    # 2. Detect Vendor (or use provided)
    if payload.vendor and payload.vendor != "auto":
        detected_vendor = payload.vendor
    else:
        detected_vendor = detect_vendor(sanitized_config)

    # 3. Create or Match Device
    device_id = payload.device_id
    if not device_id:
        device_id = generate_id()
        device_doc = {
            "device_id": device_id,
            "hostname": f"{detected_vendor}-audited-node",
            "vendor": detected_vendor,
            "device_type": "router" if "router" in detected_vendor or "cisco" in detected_vendor else "firewall",
            "criticality": "high",
            "management_ip": "10.0.0.1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_audit_at": datetime.utcnow(),
            "total_findings": 0,
            "risk_score": 0.0,
            "compliance_score": 0.0
        }
        await db.devices.insert_one(device_doc)

    # 4. Save Configuration record
    config_id = generate_id()
    config_doc = {
        "config_id": config_id,
        "device_id": device_id,
        "raw_config": sanitized_config,
        "vendor": detected_vendor,
        "filename": payload.filename or "uploaded_config.cfg",
        "created_at": datetime.utcnow(),
        "size_bytes": len(sanitized_config),
        "line_count": len(sanitized_config.splitlines())
    }
    await db.configurations.insert_one(config_doc)

    # 5. Parse into NSIR
    audit_id = generate_id()
    nsir = parse_config(detected_vendor, sanitized_config, device_id)

    # Update hostname if detected in NSIR
    if nsir.hostname and nsir.hostname != "unknown-cisco":
        await db.devices.update_one(
            {"device_id": device_id},
            {"$set": {"hostname": nsir.hostname, "last_audit_at": datetime.utcnow()}}
        )

    # 6. Run Compliance Engine
    frameworks = payload.frameworks or [FrameworkEnum.CIS, FrameworkEnum.NIST, FrameworkEnum.STIG]
    findings = run_compliance_checks(
        nsir=nsir,
        raw_config=sanitized_config,
        audit_id=audit_id,
        frameworks=frameworks
    )

    # 7. Compute Scores
    compliance_score = calculate_compliance_score(findings)
    risk_score = calculate_risk_score(findings)

    crit_count = sum(1 for f in findings if f.severity == "critical")
    high_count = sum(1 for f in findings if f.severity == "high")
    med_count = sum(1 for f in findings if f.severity == "medium")
    low_count = sum(1 for f in findings if f.severity == "low")
    info_count = sum(1 for f in findings if f.severity == "info")

    duration_ms = int((time.time() - start_time) * 1000)

    # 8. Save Audit Document
    audit_doc = {
        "audit_id": audit_id,
        "device_id": device_id,
        "config_id": config_id,
        "status": AuditStatusEnum.COMPLETED,
        "frameworks": frameworks,
        "total_findings": len(findings),
        "critical_count": crit_count,
        "high_count": high_count,
        "medium_count": med_count,
        "low_count": low_count,
        "info_count": info_count,
        "compliance_score": compliance_score,
        "risk_score": risk_score,
        "vendor_detected": detected_vendor,
        "hostname_detected": nsir.hostname or "audited-node",
        "created_at": datetime.utcnow(),
        "completed_at": datetime.utcnow(),
        "duration_ms": duration_ms,
        "error_message": None
    }
    await db.audits.insert_one(audit_doc)

    # 9. Store Findings and generate Remediation Plans
    for finding in findings:
        f_dict = finding.model_dump()
        await db.findings.insert_one(f_dict)

        # Generate and simulate remediation
        rem_plan = generate_remediation_plan(finding)
        sim_res = simulate_remediation(rem_plan)
        val_res = validate_remediation(rem_plan)
        rem_plan.simulation_result = sim_res["simulation_output"]
        rem_plan.validation_result = val_res["validation_output"]
        rem_plan.status = "simulated"
        await db.remediation.insert_one(rem_plan.model_dump())

    # 10. Update device metrics
    await db.devices.update_one(
        {"device_id": device_id},
        {"$set": {
            "total_findings": len(findings),
            "risk_score": risk_score,
            "compliance_score": compliance_score,
            "last_audit_at": datetime.utcnow()
        }}
    )

    created_audit = await db.audits.find_one({"audit_id": audit_id}, {"_id": 0})
    return created_audit


@router.get("", response_model=List[Audit])
async def list_audits(device_id: Optional[str] = None):
    db = get_db()
    query = {}
    if device_id:
        query["device_id"] = device_id
    cursor = db.audits.find(query, {"_id": 0}).sort("created_at", -1)
    audits = await cursor.to_list(length=50)
    return audits


@router.get("/{audit_id}")
async def get_audit_details(audit_id: str):
    db = get_db()
    audit = await db.audits.find_one({"audit_id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    findings = await db.findings.find({"audit_id": audit_id}, {"_id": 0}).to_list(100)
    config = await db.configurations.find_one({"config_id": audit.get("config_id")}, {"_id": 0})
    
    return {
        "audit": audit,
        "findings": findings,
        "config_summary": {
            "filename": config.get("filename") if config else None,
            "size_bytes": config.get("size_bytes") if config else 0,
            "line_count": config.get("line_count") if config else 0
        }
    }
