"""
NETRA Compliance Explorer & Framework Policy Routes
"""
from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.services.compliance_engine import VENDOR_RULES

router = APIRouter()


@router.get("/rules")
async def get_compliance_rules(framework: Optional[str] = None, severity: Optional[str] = None):
    """List all available compliance rules across vendors and frameworks"""
    all_rules = []
    seen_ids = set()

    for vendor, rules in VENDOR_RULES.items():
        for r in rules:
            if r.control_id not in seen_ids:
                seen_ids.add(r.control_id)
                if framework and r.framework != framework:
                    continue
                if severity and r.severity != severity:
                    continue
                all_rules.append({
                    "control_id": r.control_id,
                    "control_name": r.control_name,
                    "framework": r.framework,
                    "severity": r.severity,
                    "title": r.title,
                    "description": r.description,
                    "impact": r.impact,
                    "remediation_summary": r.remediation_summary,
                    "vendor_applicability": vendor
                })

    return {
        "total_rules": len(all_rules),
        "rules": all_rules
    }


@router.get("/framework-stats")
async def get_framework_stats():
    """Returns network-wide compliance percentage broken down by standard framework"""
    db = get_db()
    total_findings = await db.findings.count_documents({})
    
    frameworks = ["CIS", "NIST", "STIG", "ISO27001", "PCI-DSS"]
    stats = {}

    for fw in frameworks:
        fw_findings = await db.findings.count_documents({"framework": fw})
        # Score calculation: 100 minus penalty based on findings
        score = max(35.0, round(100.0 - (fw_findings * 3.8), 1))
        stats[fw] = {
            "name": fw,
            "compliance_pct": score,
            "findings_count": fw_findings,
            "status": "Compliant" if score >= 85 else ("Warning" if score >= 60 else "Non-Compliant")
        }

    return stats
