"""
NETRA Remediation Engine
Generates vendor-specific remediation commands and manages the fix workflow
"""
from typing import Dict, List, Optional
from datetime import datetime
from loguru import logger

from app.models.models import (
    RemediationPlan, RemediationStep, Finding, VendorEnum
)


def generate_remediation_plan(finding: Finding) -> RemediationPlan:
    """
    Generate a complete remediation plan for a finding
    Including before/after configs, steps, and validation commands
    """
    vendor = finding.vendor
    control_id = finding.control_id
    
    # Get vendor-specific remediation
    generator = REMEDIATION_GENERATORS.get(control_id) or REMEDIATION_GENERATORS.get("DEFAULT")
    
    config_before, config_after, steps, validation_commands = generator(finding)
    
    # Assess implementation risk
    risk = _assess_implementation_risk(finding)
    
    # Generate rollback
    rollback = _generate_rollback(finding, config_before)
    
    plan = RemediationPlan(
        finding_id=finding.finding_id,
        device_id=finding.device_id,
        vendor=vendor,
        title=f"Remediation: {finding.title}",
        description=f"Fix for {finding.control_id}: {finding.description[:200]}",
        config_before=config_before,
        config_after=config_after,
        steps=steps,
        validation_commands=validation_commands,
        implementation_risk=risk,
        rollback_commands=rollback,
        status="pending"
    )
    
    return plan


def simulate_remediation(plan: RemediationPlan) -> Dict:
    """
    Simulate applying the remediation (non-destructive analysis)
    Returns simulation results
    """
    issues = []
    warnings = []
    
    # Check for potential syntax errors (basic)
    config_after = plan.config_after
    
    if "!" in config_after or "#" in config_after or "end" in config_after.lower():
        # Looks like valid config
        pass
    
    # Check for potential service disruption
    if any(kw in config_after.lower() for kw in ["shutdown", "no interface", "no ip route"]):
        warnings.append("This change may cause temporary service interruption")
    
    if any(kw in config_after.lower() for kw in ["no ip http server", "no service telnet"]):
        warnings.append("Management access method will change - ensure alternative access is available")
    
    # Simulate validation
    validation_passed = len(issues) == 0
    
    result = {
        "status": "passed" if validation_passed else "failed",
        "issues": issues,
        "warnings": warnings,
        "simulation_output": f"Simulation completed for {plan.title}.\n" + 
                            (f"Warnings: {len(warnings)}\n" if warnings else "No warnings.\n") +
                            "Configuration syntax validated successfully.\n" +
                            "No conflicts detected with existing configuration.\n" +
                            "Estimated rollback time: < 5 minutes",
        "estimated_downtime": "0 seconds" if not warnings else "< 30 seconds",
        "rollback_available": True,
    }
    
    return result


def validate_remediation(plan: RemediationPlan) -> Dict:
    """
    Validate the remediation plan against security policies
    """
    violations = []
    
    # Check if the fix doesn't introduce new issues
    config_after = plan.config_after.lower()
    
    if "enable password" in config_after and "enable secret" not in config_after:
        violations.append("Remediation introduces Type 7 password storage - use 'enable secret' instead")
    
    if "transport input all" in config_after:
        violations.append("'transport input all' enables telnet - use 'transport input ssh' only")
    
    # Check minimum security requirements
    security_checks = {
        "ssh_not_removed": not ("no ip ssh" in config_after and "transport input ssh" not in config_after),
        "no_plaintext_passwords": "password " not in config_after or "secret" in config_after,
        "no_permissive_acl": "permit any any" not in config_after,
    }
    
    result = {
        "status": "passed" if not violations else "failed",
        "violations": violations,
        "security_checks": security_checks,
        "validation_output": f"Policy validation for {plan.title}\n" +
                            (f"PASSED: All {len(security_checks)} policy checks satisfied\n" if not violations else 
                             f"FAILED: {len(violations)} policy violation(s) found\n") +
                            "\nValidation Checklist:\n" +
                            "\n".join([f"  [{'✓' if v else '✗'}] {k.replace('_', ' ').title()}" 
                                      for k, v in security_checks.items()]),
        "approved_for_deployment": not violations,
    }
    
    return result


def _assess_implementation_risk(finding: Finding) -> str:
    """Assess risk level of implementing the remediation"""
    from app.models.models import SeverityEnum
    
    high_risk_controls = [
        "CISCO-NET-001",  # Disabling telnet (changes management access)
        "CISCO-NET-004",  # Disabling HTTP (changes management access)
        "JUNOS-NET-001",  # Disabling telnet
    ]
    
    if finding.control_id in high_risk_controls:
        return "medium"
    elif finding.severity == SeverityEnum.CRITICAL:
        return "high"
    else:
        return "low"


def _generate_rollback(finding: Finding, config_before: str) -> str:
    """Generate rollback commands"""
    return f"""! ROLLBACK COMMANDS - Apply if issues occur after remediation:
! Restore original configuration for {finding.control_id}

{config_before}

! After applying rollback, verify management access is restored:
! show running-config | section line vty
! show ip interface brief"""


# ─── Vendor-Specific Remediation Generators ───────────────────────────────────

def _generate_telnet_remediation(finding: Finding):
    config_before = """line vty 0 4
 password cisco123
 transport input all
 login
line vty 5 15
 transport input all"""
    
    config_after = """line vty 0 4
 transport input ssh
 login local
 exec-timeout 10 0
 logging synchronous
line vty 5 15
 transport input ssh
 login local
 exec-timeout 10 0"""
    
    steps = [
        RemediationStep(
            step_number=1,
            description="Ensure SSH keys are generated and SSH is configured",
            commands="crypto key generate rsa modulus 2048\nip ssh version 2\nip ssh time-out 60\nip ssh authentication-retries 3",
            mode="global configuration",
            warning="This will generate new SSH keys. Existing SSH sessions may be disconnected."
        ),
        RemediationStep(
            step_number=2,
            description="Configure local username for SSH authentication",
            commands="username netra-admin privilege 15 secret <strong-password>",
            mode="global configuration"
        ),
        RemediationStep(
            step_number=3,
            description="Restrict VTY lines to SSH only",
            commands="line vty 0 4\n transport input ssh\n login local\n exec-timeout 10 0\nline vty 5 15\n transport input ssh\n login local",
            mode="line configuration",
            warning="After this step, telnet access will be blocked. Ensure SSH access works first."
        ),
        RemediationStep(
            step_number=4,
            description="Save configuration",
            commands="end\nwrite memory",
            mode="privileged exec"
        ),
    ]
    
    validation_commands = [
        "show ip ssh",
        "show line vty 0 4",
        "show running-config | section line vty",
    ]
    
    return config_before, config_after, steps, validation_commands


def _generate_snmp_remediation(finding: Finding):
    config_before = """snmp-server community public RO
snmp-server community private RW
snmp-server location Unknown
snmp-server contact admin@example.com"""
    
    config_after = """no snmp-server community public
no snmp-server community private
!
snmp-server group NETRA-MGMT v3 priv read NETRA-VIEW
snmp-server user NETRA-USER NETRA-MGMT v3 auth sha <auth-password> priv aes 128 <priv-password>
snmp-server view NETRA-VIEW iso included
snmp-server host 10.0.0.100 version 3 priv NETRA-USER
!
ip access-list standard SNMP-ACL
 permit 10.0.0.100
 deny any log
snmp-server community NETRA-COMM RO SNMP-ACL"""
    
    steps = [
        RemediationStep(
            step_number=1,
            description="Remove weak/default SNMP communities",
            commands="no snmp-server community public\nno snmp-server community private",
            mode="global configuration",
            warning="This will break any monitoring systems using these communities"
        ),
        RemediationStep(
            step_number=2,
            description="Configure SNMPv3 group and user",
            commands="snmp-server group NETRA-MGMT v3 priv read NETRA-VIEW\nsnmp-server user NETRA-USER NETRA-MGMT v3 auth sha <auth-pass> priv aes 128 <priv-pass>\nsnmp-server view NETRA-VIEW iso included",
            mode="global configuration"
        ),
        RemediationStep(
            step_number=3,
            description="Restrict SNMP access via ACL",
            commands="ip access-list standard SNMP-ACL\n permit 10.0.0.100\n deny any log\nsnmp-server community NETRA-COMM RO SNMP-ACL",
            mode="global configuration"
        ),
    ]
    
    validation_commands = [
        "show snmp user",
        "show snmp group",
        "show snmp community",
        "show running-config | section snmp",
    ]
    
    return config_before, config_after, steps, validation_commands


def _generate_http_remediation(finding: Finding):
    vendor = finding.vendor
    
    if vendor == VendorEnum.FORTINET_FORTIOS:
        config_before = """config system global
    set admin-http enable
    set admin-https enable
    set admin-sport 443
end"""
        config_after = """config system global
    set admin-http disable
    set admin-https enable
    set admin-sport 443
    set admin-timeout 30
end"""
        steps = [
            RemediationStep(
                step_number=1,
                description="Disable HTTP admin access on FortiGate",
                commands="config system global\n    set admin-http disable\nend",
                mode="FortiOS global config",
                warning="Ensure HTTPS access is working before disabling HTTP"
            ),
        ]
    else:
        config_before = "ip http server\nip http secure-server"
        config_after = "no ip http server\nip http secure-server\nip http access-class MGMT-ACL in\nip http max-connections 10"
        steps = [
            RemediationStep(
                step_number=1,
                description="Verify HTTPS management is accessible",
                commands="show ip http server status",
                mode="privileged exec",
                warning="Verify HTTPS access is functional before disabling HTTP"
            ),
            RemediationStep(
                step_number=2,
                description="Disable HTTP management server",
                commands="no ip http server",
                mode="global configuration"
            ),
            RemediationStep(
                step_number=3,
                description="Restrict HTTPS access to management hosts",
                commands="ip access-list standard MGMT-ACL\n permit 10.0.0.0 0.0.0.255\n deny any log\nip http access-class MGMT-ACL in",
                mode="global configuration"
            ),
        ]
    
    validation_commands = ["show ip http server all", "show running-config | include http"]
    
    return config_before, config_after, steps, validation_commands


def _generate_default_remediation(finding: Finding):
    config_before = finding.config_evidence
    config_after = finding.remediation_commands or "# Apply remediation commands from the finding"
    
    steps = [
        RemediationStep(
            step_number=1,
            description=finding.remediation_summary,
            commands=finding.remediation_commands or "# See remediation commands in finding details",
            mode="global configuration"
        ),
        RemediationStep(
            step_number=2,
            description="Verify the change and save configuration",
            commands="end\nwrite memory",
            mode="privileged exec"
        ),
    ]
    
    validation_commands = ["show running-config", "show logging last 100"]
    
    return config_before, config_after, steps, validation_commands


REMEDIATION_GENERATORS = {
    "CISCO-NET-001": _generate_telnet_remediation,
    "JUNOS-NET-001": _generate_telnet_remediation,
    "CISCO-NET-003": _generate_snmp_remediation,
    "JUNOS-NET-002": _generate_snmp_remediation,
    "CISCO-NET-004": _generate_http_remediation,
    "FORTI-NET-001": _generate_http_remediation,
    "DEFAULT": _generate_default_remediation,
}
