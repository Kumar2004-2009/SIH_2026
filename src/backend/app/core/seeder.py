"""
NETRA Demo Data Seeder
Populates MongoDB with realistic sample devices, configurations, audits,
findings, remediation plans, and drift history across all vendors.
"""
from datetime import datetime, timedelta
import os
from loguru import logger

from app.core.database import get_db
from app.models.models import (
    Device, DeviceTypeEnum, VendorEnum, Configuration,
    Audit, AuditStatusEnum, FrameworkEnum, StatusEnum, generate_id
)
from app.services.vendor_detector import detect_vendor
from app.services.config_parser import parse_config
from app.services.compliance_engine import (
    run_compliance_checks, calculate_compliance_score, calculate_risk_score
)
from app.services.remediation_engine import generate_remediation_plan, simulate_remediation, validate_remediation
from app.services.drift_engine import calculate_configuration_drift


SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_configs")

SAMPLE_FILES = [
    ("cisco_ios_sample.cfg", "Core-RTR-01", VendorEnum.CISCO_IOS, DeviceTypeEnum.ROUTER, "10.0.0.1", "critical"),
    ("juniper_junos_sample.cfg", "MX480-Border", VendorEnum.JUNIPER_JUNOS, DeviceTypeEnum.ROUTER, "10.0.4.1", "high"),
    ("fortinet_fortios_sample.cfg", "FortiGate-1000D", VendorEnum.FORTINET_FORTIOS, DeviceTypeEnum.FIREWALL, "203.0.113.1", "critical"),
    ("palo_alto_sample.xml", "PA-5220-DC", VendorEnum.PALO_ALTO, DeviceTypeEnum.FIREWALL, "10.0.3.1", "high"),
    ("arista_eos_sample.cfg", "Core-SW-01", VendorEnum.ARISTA_EOS, DeviceTypeEnum.SWITCH, "10.0.2.1", "medium"),
    ("sonic_sample.json", "SONiC-Spine-01", VendorEnum.SONIC, DeviceTypeEnum.SWITCH, "10.0.5.1", "medium"),
]


async def seed_demo_data():
    db = get_db()
    if db is None:
        logger.warning("MongoDB not connected, skipping seed")
        return

    # Check if already seeded
    device_count = await db.devices.count_documents({})
    if device_count > 0:
        logger.info(f"Database already contains {device_count} devices. Skipping demo seeding.")
        return

    logger.info("[*] Seeding NETRA with realistic multi-vendor demo configurations and audits...")

    seeded_devices = []
    seeded_audits = []

    for filename, hostname, vendor, dev_type, mgmt_ip, criticality in SAMPLE_FILES:
        filepath = os.path.join(SAMPLE_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning(f"Sample file not found: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            raw_content = f.read()

        # 1. Create Device
        device_id = generate_id()
        device_doc = {
            "device_id": device_id,
            "hostname": hostname,
            "vendor": vendor,
            "device_type": dev_type,
            "model": f"{vendor.replace('_', ' ').title()} Enterprise",
            "os_version": "v15.6 / 21.4R / 7.2",
            "management_ip": mgmt_ip,
            "location": "New Delhi Tier-4 DC",
            "criticality": criticality,
            "tags": ["production", "border-perimeter" if "Border" in hostname or "Forti" in hostname else "internal"],
            "notes": "Audited under NTRO Cybersecurity Mandate 2026",
            "created_at": datetime.utcnow() - timedelta(days=2),
            "updated_at": datetime.utcnow(),
            "last_audit_at": datetime.utcnow(),
            "total_findings": 0,
            "risk_score": 0.0,
            "compliance_score": 0.0
        }

        # 2. Store Configuration
        config_id = generate_id()
        config_doc = {
            "config_id": config_id,
            "device_id": device_id,
            "raw_config": raw_content,
            "vendor": vendor,
            "filename": filename,
            "created_at": datetime.utcnow() - timedelta(days=2),
            "size_bytes": len(raw_content),
            "line_count": len(raw_content.splitlines())
        }
        await db.configurations.insert_one(config_doc)

        # 3. Parse NSIR and Execute Compliance Audit
        audit_id = generate_id()
        detected_vendor = detect_vendor(raw_content)
        nsir = parse_config(detected_vendor, raw_content, device_id)

        findings = run_compliance_checks(
            nsir=nsir,
            raw_config=raw_content,
            audit_id=audit_id,
            frameworks=[FrameworkEnum.CIS, FrameworkEnum.NIST, FrameworkEnum.STIG, FrameworkEnum.ISO27001]
        )

        comp_score = calculate_compliance_score(findings)
        risk_score = calculate_risk_score(findings)

        crit_count = sum(1 for f in findings if f.severity == "critical")
        high_count = sum(1 for f in findings if f.severity == "high")
        med_count = sum(1 for f in findings if f.severity == "medium")
        low_count = sum(1 for f in findings if f.severity == "low")
        info_count = sum(1 for f in findings if f.severity == "info")

        # 4. Save Audit Record
        audit_doc = {
            "audit_id": audit_id,
            "device_id": device_id,
            "config_id": config_id,
            "status": AuditStatusEnum.COMPLETED,
            "frameworks": [FrameworkEnum.CIS, FrameworkEnum.NIST, FrameworkEnum.STIG, FrameworkEnum.ISO27001],
            "total_findings": len(findings),
            "critical_count": crit_count,
            "high_count": high_count,
            "medium_count": med_count,
            "low_count": low_count,
            "info_count": info_count,
            "compliance_score": comp_score,
            "risk_score": risk_score,
            "vendor_detected": detected_vendor,
            "hostname_detected": nsir.hostname or hostname,
            "created_at": datetime.utcnow() - timedelta(hours=4),
            "completed_at": datetime.utcnow() - timedelta(hours=4) + timedelta(seconds=2),
            "duration_ms": 1840,
            "error_message": None
        }
        await db.audits.insert_one(audit_doc)
        seeded_audits.append(audit_id)

        # 5. Save Findings and Generate Remediations
        for f in findings:
            f_dict = f.model_dump()
            await db.findings.insert_one(f_dict)

            # Generate sample remediation plans
            rem_plan = generate_remediation_plan(f)
            sim_res = simulate_remediation(rem_plan)
            val_res = validate_remediation(rem_plan)
            rem_plan.simulation_result = sim_res["simulation_output"]
            rem_plan.validation_result = val_res["validation_output"]
            rem_plan.status = "simulated"
            await db.remediation.insert_one(rem_plan.model_dump())

        # Update Device metrics
        device_doc["total_findings"] = len(findings)
        device_doc["risk_score"] = risk_score
        device_doc["compliance_score"] = comp_score
        await db.devices.insert_one(device_doc)
        seeded_devices.append(device_doc)

    # 6. Seed Drift Data for Cisco Core Router
    if seeded_devices:
        cisco_dev = seeded_devices[0]
        baseline_cfg = open(os.path.join(SAMPLE_DIR, "cisco_ios_sample.cfg")).read()
        # Simulated drifted config with an unauthorized telnet and removed encryption
        drifted_cfg = baseline_cfg + "\nline vty 16 32\n transport input telnet\n login\nusername backdoor secret cisco999\n"

        drift_entry = calculate_configuration_drift(
            device_id=cisco_dev["device_id"],
            config_a_id=generate_id(),
            config_b_id=generate_id(),
            config_a_text=baseline_cfg,
            config_b_text=drifted_cfg,
            config_a_date=datetime.utcnow() - timedelta(days=7),
            config_b_date=datetime.utcnow()
        )
        await db.drift.insert_one(drift_entry.model_dump())

    # 7. Seed Initial Comprehensive Audit Report
    report_doc = {
        "report_id": generate_id(),
        "audit_ids": seeded_audits,
        "device_ids": [d["device_id"] for d in seeded_devices],
        "title": "NTRO Multi-Vendor Network Compliance Executive Audit - Q3 2026",
        "report_type": "executive",
        "total_devices": len(seeded_devices),
        "total_findings": sum(d.get("total_findings", 0) for d in seeded_devices),
        "overall_risk_score": 7.4,
        "compliance_percentage": 68.5,
        "severity_breakdown": {
            "critical": 6,
            "high": 9,
            "medium": 7,
            "low": 3,
            "info": 1
        },
        "vendor_breakdown": {
            "cisco_ios": 1,
            "juniper_junos": 1,
            "fortinet_fortios": 1,
            "palo_alto": 1,
            "arista_eos": 1,
            "sonic": 1
        },
        "framework_breakdown": {
            "CIS": 64.2,
            "NIST": 71.0,
            "STIG": 58.5,
            "ISO27001": 80.0
        },
        "executive_summary": "Comprehensive network security audit conducted across 6 heterogeneous network devices. Multiple critical findings identified including cleartext management protocols (Telnet, HTTP) and default SNMP strings.",
        "recommendations": [
            "Decommission Telnet across Core-RTR-01 and MX480-Border immediately; enforce SSHv2 with 2048-bit RSA keys.",
            "Revoke default SNMP community strings ('public'/'private') and migrate to SNMPv3 with authPriv AES encryption.",
            "Disable HTTP administration on FortiGate and Arista switches in favor of TLS 1.3 secured interfaces.",
            "Deploy centralized syslog streaming to NTRO SIEM repository."
        ],
        "created_at": datetime.utcnow() - timedelta(hours=2),
        "generated_by": "NETRA Automated Engine v1.0.0"
    }
    await db.reports.insert_one(report_doc)

    logger.info("[+] NETRA Demo Seeding Complete! All collections initialized.")
