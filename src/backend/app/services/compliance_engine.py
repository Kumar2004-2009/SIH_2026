"""
NETRA Compliance Engine
Deterministic rule-based compliance checks against CIS, NIST, STIG, ISO27001, PCI-DSS
Every finding includes exact configuration evidence, line references, and remediation
"""
import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from app.models.models import (
    Finding, Evidence, NSIR, VendorEnum, SeverityEnum,
    FrameworkEnum, StatusEnum
)


def generate_id() -> str:
    return str(uuid.uuid4())


# ─── Compliance Rules ─────────────────────────────────────────────────────────

class ComplianceRule:
    def __init__(self, control_id, control_name, framework, severity, title, 
                 description, impact, remediation_summary):
        self.control_id = control_id
        self.control_name = control_name
        self.framework = framework
        self.severity = severity
        self.title = title
        self.description = description
        self.impact = impact
        self.remediation_summary = remediation_summary

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        raise NotImplementedError


# ─── Cisco IOS/IOS-XE Rules ───────────────────────────────────────────────────

class CiscoTelnetEnabledRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-001",
            control_name="Disable Insecure Management Protocols",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.CRITICAL,
            title="Telnet Enabled on VTY Lines",
            description="Telnet transmits data including credentials in plaintext, making it vulnerable to eavesdropping and man-in-the-middle attacks.",
            impact="An attacker with network access can capture administrator credentials and gain unauthorized access to the device.",
            remediation_summary="Replace 'transport input telnet' with 'transport input ssh' on all VTY lines and ensure SSH is properly configured."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if not nsir.telnet_enabled:
            return None
        
        # Find evidence
        evidence_lines = []
        for i, line in enumerate(raw_config.splitlines()):
            if re.search(r'transport input.*telnet', line, re.IGNORECASE):
                evidence_lines.append(f"Line {i+1}: {line.strip()}")
        
        config_evidence = "\n".join(evidence_lines) if evidence_lines else "VTY line allows telnet (default - no transport input restriction)"
        
        remediation_commands = """! Remediation Steps:
line vty 0 4
 transport input ssh
 login local
!
! Also ensure SSH is configured:
ip ssh version 2
crypto key generate rsa modulus 2048"""

        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="line vty section",
            confidence_score=0.95,
            risk_score=9.0,
            remediation_summary=self.remediation_summary,
            remediation_commands=remediation_commands,
            tags=["telnet", "insecure-protocol", "management"],
            references=["CIS Cisco IOS 15 Benchmark v4.1.0 - Section 1.1", "NIST SP 800-115"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Telnet is an unencrypted protocol. All data including passwords are transmitted in plaintext."
        )]
        
        return finding


class CiscoSSHv1Rule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-002",
            control_name="Enforce SSH Version 2",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.HIGH,
            title="SSH Version 1 or Not Enforced to Version 2",
            description="SSH version 1 has known cryptographic vulnerabilities. Only SSHv2 should be permitted.",
            impact="SSH version 1 is susceptible to man-in-the-middle attacks and protocol downgrades.",
            remediation_summary="Configure 'ip ssh version 2' to enforce SSHv2 exclusively."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_ssh_v2 = bool(re.search(r"^ip ssh version 2", raw_config, re.MULTILINE))
        has_ssh = bool(re.search(r"^ip ssh", raw_config, re.MULTILINE))
        
        if has_ssh_v2:
            return None
        
        if not has_ssh:
            config_evidence = "No SSH version configuration found - defaults to allowing SSHv1"
        else:
            v1_match = re.search(r"^(ip ssh version 1.*)$", raw_config, re.MULTILINE)
            config_evidence = v1_match.group(0) if v1_match else "ip ssh version not explicitly set to 2"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.90,
            risk_score=7.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="ip ssh version 2\nip ssh time-out 60\nip ssh authentication-retries 3",
            tags=["ssh", "encryption", "management-protocol"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="SSHv1 allows protocol downgrade and has known vulnerabilities including CRC32 compensation attack."
        )]
        
        return finding


class CiscoSNMPv1v2Rule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-003",
            control_name="Secure SNMP Configuration",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.HIGH,
            title="SNMP v1/v2c with Weak Community String",
            description="SNMP v1 and v2c use community strings for authentication which are transmitted in plaintext and are easily guessable if common names like 'public' or 'private' are used.",
            impact="Attackers can enumerate device information, extract configurations, or modify device settings if SNMP write access is configured.",
            remediation_summary="Migrate to SNMPv3 with authentication and encryption, or restrict SNMP access to specific management hosts via ACL."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if not nsir.snmp_enabled:
            return None
        
        # Check for weak community strings
        communities = re.findall(r"snmp-server community (\S+)", raw_config, re.IGNORECASE)
        weak_communities = [c for c in communities if c.lower() in ["public", "private", "cisco", "admin", "community", "snmp", "all"]]
        
        if not weak_communities and nsir.snmp_version == "v3":
            return None
        
        evidence_lines = []
        for i, line in enumerate(raw_config.splitlines()):
            if re.search(r"snmp-server community", line, re.IGNORECASE):
                evidence_lines.append(f"Line {i+1}: {line.strip()}")
        
        config_evidence = "\n".join(evidence_lines) if evidence_lines else "snmp-server community configured"
        
        severity = SeverityEnum.CRITICAL if weak_communities else SeverityEnum.HIGH
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=severity,
            title=self.title + (f" (Weak string: {', '.join(weak_communities)})" if weak_communities else ""),
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration - SNMP",
            confidence_score=0.98 if weak_communities else 0.80,
            risk_score=9.5 if weak_communities else 7.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="""! Remove weak SNMPv2 communities:
no snmp-server community public
no snmp-server community private
! Configure SNMPv3:
snmp-server group NETRA-MGMT v3 priv
snmp-server user NETRA-USER NETRA-MGMT v3 auth sha AuthPass123 priv aes 128 PrivPass123
snmp-server view NETRA-VIEW iso included""",
            tags=["snmp", "weak-credentials", "information-disclosure"],
            references=["CIS Cisco IOS 15 Benchmark - Section 2.4", "NIST SP 800-161"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation=f"SNMP community strings found: {communities}. Weak/default strings allow unauthorized device access."
        )]
        
        return finding


class CiscoHTTPServerRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-004",
            control_name="Disable Unencrypted HTTP Management",
            framework=FrameworkEnum.STIG,
            severity=SeverityEnum.HIGH,
            title="HTTP Management Server Enabled",
            description="The HTTP management server transmits management traffic in plaintext, exposing device credentials and configuration to eavesdropping.",
            impact="Credentials and sensitive device configuration can be intercepted by network eavesdroppers.",
            remediation_summary="Disable HTTP server with 'no ip http server'. Use HTTPS (ip http secure-server) only, or preferably CLI over SSH."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if not nsir.http_enabled:
            return None
        
        evidence_lines = []
        for i, line in enumerate(raw_config.splitlines()):
            if re.search(r"^ip http server$", line, re.IGNORECASE):
                evidence_lines.append(f"Line {i+1}: {line.strip()}")
        
        config_evidence = "\n".join(evidence_lines) if evidence_lines else "ip http server"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.99,
            risk_score=7.8,
            remediation_summary=self.remediation_summary,
            remediation_commands="no ip http server\nip http secure-server\nip http access-class MGMT-ACL in",
            tags=["http", "plaintext", "management-interface"],
            references=["DISA STIG Cisco IOS Router - V-3966"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="HTTP management interface found enabled. All management traffic is transmitted unencrypted."
        )]
        
        return finding


class CiscoNoPasswordEncryptionRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-005",
            control_name="Enable Password Encryption Service",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.MEDIUM,
            title="Service Password-Encryption Not Enabled",
            description="Without service password-encryption, type 7 passwords in the configuration are stored in reversibly obfuscated format, easily decoded.",
            impact="Configuration backup files or unauthorized configuration access exposes passwords that can be trivially decoded.",
            remediation_summary="Enable 'service password-encryption' and use 'enable secret' (type 5/9) instead of 'enable password'."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if nsir.service_password_encryption:
            return None
        
        has_password_lines = bool(re.search(r"^(username|password|enable password)", raw_config, re.MULTILINE | re.IGNORECASE))
        if not has_password_lines:
            return None
        
        evidence_lines = ["service password-encryption not found in configuration"]
        
        has_enable_password = re.search(r"^enable password\s+(\S+)", raw_config, re.MULTILINE)
        if has_enable_password:
            evidence_lines.append(f"Found: enable password {has_enable_password.group(1)} (plaintext!)")
        
        config_evidence = "\n".join(evidence_lines)
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.90,
            risk_score=5.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="service password-encryption\n! Replace 'enable password' with:\nenable secret <strong-password>",
            tags=["password", "encryption", "credentials"],
            references=["CIS Cisco IOS 15 Benchmark - Section 1.2"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Passwords stored in reversible format can be decoded from configuration backups."
        )]
        
        return finding


class CiscoNoLoginBannerRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-006",
            control_name="Configure Warning Banners",
            framework=FrameworkEnum.STIG,
            severity=SeverityEnum.LOW,
            title="Missing Warning/Login Banner",
            description="A login banner is required to provide legal warning to unauthorized users and ensure the organization's right to monitor.",
            impact="Without a warning banner, the organization may face legal challenges when prosecuting unauthorized access.",
            remediation_summary="Configure a login banner using 'banner login' and 'banner motd' with appropriate legal warning text."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_banner = bool(re.search(r"^banner\s+(login|motd|exec)", raw_config, re.MULTILINE))
        if has_banner:
            return None
        
        config_evidence = "No banner login, banner motd, or banner exec configured"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.99,
            risk_score=3.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="""banner motd ^
AUTHORIZED ACCESS ONLY. This system is the property of [Organization].
Unauthorized access is prohibited and will be prosecuted.
All activities are logged and monitored.
^""",
            tags=["banner", "legal", "access-control"],
            references=["DISA STIG Cisco IOS Router - V-3966", "NIST AC-8"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="No login banners configured. Legal warning banners are required by most security frameworks."
        )]
        
        return finding


class CiscoNTPNotConfiguredRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-007",
            control_name="Configure NTP for Log Integrity",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.MEDIUM,
            title="NTP Not Configured or Synchronized",
            description="Without NTP, device clocks can drift, making log correlation across devices unreliable and potentially invalidating forensic evidence.",
            impact="Time-skewed logs make incident investigation unreliable. Log timestamps may not correlate with actual events.",
            remediation_summary="Configure at least two NTP servers with authentication. Use 'ntp authenticate', 'ntp authentication-key', and 'ntp trusted-key'."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if nsir.ntp_servers:
            return None
        
        config_evidence = "No NTP server configuration found"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.95,
            risk_score=5.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="""ntp authenticate
ntp authentication-key 1 md5 <key>
ntp trusted-key 1
ntp server 10.0.0.1 key 1 prefer
ntp server 10.0.0.2 key 1""",
            tags=["ntp", "time-synchronization", "logging"],
            references=["CIS Cisco IOS 15 Benchmark - Section 3.1", "NIST AU-8"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="NTP not configured. Device time may drift, making log correlation inaccurate."
        )]
        
        return finding


class CiscoNoLoggingRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-008",
            control_name="Configure Centralized Logging",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.MEDIUM,
            title="No Centralized Syslog Server Configured",
            description="Without centralized logging, security events are only stored locally on the device and may be lost if the device is compromised or fails.",
            impact="Security incidents may go undetected. Forensic evidence may be unavailable or tampered with after a breach.",
            remediation_summary="Configure syslog forwarding to a SIEM or centralized logging server. Set minimum logging level to 'informational'."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if nsir.logging_servers:
            return None
        
        config_evidence = "No remote logging/syslog server configured"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.95,
            risk_score=5.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="""logging on
logging trap informational
logging 10.0.0.100
logging source-interface Loopback0
service timestamps log datetime msec localtime show-timezone""",
            tags=["logging", "siem", "audit-trail"],
            references=["NIST AU-3", "NIST AU-9", "CIS Cisco IOS 15 Benchmark - Section 3"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Centralized logging not configured. Security events only stored locally on device."
        )]
        
        return finding


class CiscoIPSourceRouteRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-009",
            control_name="Disable IP Source Routing",
            framework=FrameworkEnum.STIG,
            severity=SeverityEnum.HIGH,
            title="IP Source Routing Enabled",
            description="IP source routing allows the sender to specify the route a packet should take through the network, bypassing security controls.",
            impact="Attackers can use source routing to bypass firewall rules and access internal network resources.",
            remediation_summary="Disable IP source routing with 'no ip source-route' in global configuration."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        # Source routing is enabled by default on Cisco IOS; must be explicitly disabled
        disabled = bool(re.search(r"^no ip source-route", raw_config, re.MULTILINE))
        if disabled:
            return None
        
        config_evidence = "ip source-route enabled (default) - 'no ip source-route' not configured"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.85,
            risk_score=7.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="no ip source-route",
            tags=["ip-source-routing", "network-security", "bypass"],
            references=["DISA STIG Cisco IOS Router - V-3041", "CIS Benchmark Section 2.1"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="IP source routing not disabled. This is enabled by default on Cisco IOS and must be explicitly disabled."
        )]
        
        return finding


class CiscoWeakEnablePasswordRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="CISCO-NET-010",
            control_name="Use Strong Enable Secret",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.CRITICAL,
            title="Enable Password Used Instead of Enable Secret",
            description="'enable password' stores the password with weak reversible Type 7 encryption. 'enable secret' uses MD5 (Type 5) or SHA256 (Type 9) hashing.",
            impact="The enable password can be decoded from the configuration file in seconds using freely available tools.",
            remediation_summary="Replace 'enable password' with 'enable secret <password>' to use strong password hashing."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_enable_password = re.search(r"^enable password\s+(\S+)", raw_config, re.MULTILINE)
        has_enable_secret = bool(re.search(r"^enable secret", raw_config, re.MULTILINE))
        
        if not has_enable_password or has_enable_secret:
            return None
        
        config_evidence = has_enable_password.group(0)
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=SeverityEnum.CRITICAL,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="global configuration",
            confidence_score=0.99,
            risk_score=9.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="no enable password\nenable secret <strong-password-here>",
            tags=["password", "weak-credentials", "privilege-escalation"],
            references=["CIS Cisco IOS 15 Benchmark - Section 1.1.1"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="'enable password' uses Type 7 encoding which is easily reversible. Use 'enable secret' for Type 5/9 hashing."
        )]
        
        return finding


# ─── Juniper-Specific Rules ───────────────────────────────────────────────────

class JuniperTelnetRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="JUNOS-NET-001",
            control_name="Disable Telnet Service",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.CRITICAL,
            title="Telnet Service Enabled on JunOS Device",
            description="JunOS telnet service transmits credentials and data in cleartext.",
            impact="Credential theft via network eavesdropping. Full device compromise possible.",
            remediation_summary="Disable telnet with 'delete system services telnet' and use SSH exclusively."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if not nsir.telnet_enabled:
            return None
        
        config_evidence = "set system services telnet"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="system services configuration",
            confidence_score=0.99,
            risk_score=9.2,
            remediation_summary=self.remediation_summary,
            remediation_commands="delete system services telnet\nset system services ssh root-login deny\ncommit",
            tags=["telnet", "insecure-protocol", "juniper"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="JunOS telnet service is enabled. All traffic including authentication is transmitted unencrypted."
        )]
        
        return finding


class JuniperSNMPPublicRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="JUNOS-NET-002",
            control_name="Secure SNMP Community Strings",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.HIGH,
            title="SNMP Default Community String Configured",
            description="Default SNMP community strings (public/private) are widely known and allow unauthenticated SNMP access.",
            impact="Full device information disclosure and potential configuration modification via SNMP write access.",
            remediation_summary="Remove default communities and migrate to SNMPv3 with authentication and privacy."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        weak_communities = re.findall(
            r"set snmp community (public|private|cisco|admin)\b", 
            raw_config, re.IGNORECASE
        )
        
        if not weak_communities:
            return None
        
        config_evidence = "\n".join([f"set snmp community {c}" for c in weak_communities])
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="SNMP configuration",
            confidence_score=0.98,
            risk_score=8.5,
            remediation_summary=self.remediation_summary,
            remediation_commands=f"""delete snmp community public
delete snmp community private
set snmp v3 usm local-engine user netra-admin authentication-sha authentication-password <authpass>
set snmp v3 usm local-engine user netra-admin privacy-aes128 privacy-password <privpass>
commit""",
            tags=["snmp", "weak-credentials", "information-disclosure", "juniper"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation=f"Default SNMP community strings found: {weak_communities}"
        )]
        
        return finding


# ─── Fortinet-Specific Rules ──────────────────────────────────────────────────

class FortinetHTTPAdminRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="FORTI-NET-001",
            control_name="Disable HTTP Administrative Access",
            framework=FrameworkEnum.STIG,
            severity=SeverityEnum.HIGH,
            title="HTTP Administrative Interface Enabled on FortiGate",
            description="The HTTP administrative interface on FortiGate transmits management traffic including login credentials in plaintext.",
            impact="Credentials captured by eavesdropping can be used to fully compromise the firewall and bypass all security policies.",
            remediation_summary="Disable HTTP admin access and use HTTPS only: 'set admin-http disable' under config system global."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if not nsir.http_enabled:
            return None
        
        evidence_lines = []
        for i, line in enumerate(raw_config.splitlines()):
            if re.search(r"set admin-http\s+enable", line, re.IGNORECASE):
                evidence_lines.append(f"Line {i+1}: {line.strip()}")
        
        config_evidence = "\n".join(evidence_lines) if evidence_lines else "admin-http enable (configured)"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="config system global",
            confidence_score=0.99,
            risk_score=8.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="""config system global
    set admin-http disable
    set admin-https enable
    set admin-sport 443
end""",
            tags=["http", "plaintext", "admin-access", "fortinet"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="HTTP admin interface enabled on FortiGate. All admin traffic can be intercepted."
        )]
        
        return finding


class FortinetWeakPasswordPolicyRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="FORTI-NET-002",
            control_name="Enforce Strong Password Policy",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.MEDIUM,
            title="Weak Admin Password Policy on FortiGate",
            description="FortiGate password policy not configured to enforce minimum complexity requirements.",
            impact="Weak or default passwords on administrative accounts can be brute-forced, granting full firewall access.",
            remediation_summary="Configure password policy: minimum length 12, complexity requirements, and account lockout."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_password_policy = bool(re.search(r"set password-policy-status enable", raw_config, re.IGNORECASE))
        
        if has_password_policy:
            return None
        
        config_evidence = "password-policy-status not enabled - no password complexity enforcement"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="config system password-policy",
            confidence_score=0.85,
            risk_score=5.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="""config system password-policy
    set status enable
    set minimum-length 12
    set complexity enable
    set min-lower-case-letter 1
    set min-upper-case-letter 1
    set min-non-alphanumeric 1
    set min-number 1
end""",
            tags=["password-policy", "authentication", "fortinet"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="No password complexity policy configured. Weak passwords can be brute-forced."
        )]
        
        return finding


# ─── Palo Alto Rules ──────────────────────────────────────────────────────────

class PaloAltoZoneProtectionRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="PANOS-NET-001",
            control_name="Configure Zone Protection Profiles",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.HIGH,
            title="Missing Zone Protection Profile on Public Zone",
            description="Zone Protection Profiles defend against reconnaissance and flood attacks at the zone level, providing a first line of defense.",
            impact="Without zone protection, the device is vulnerable to port scans, SYN floods, and other volumetric attacks.",
            remediation_summary="Create and apply a Zone Protection Profile to untrust/external zones with appropriate flood protection settings."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_zone_protection = bool(re.search(r"zone-protection-profile", raw_config, re.IGNORECASE))
        
        if has_zone_protection:
            return None
        
        config_evidence = "No zone-protection-profile configured on security zones"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="network zones configuration",
            confidence_score=0.85,
            risk_score=7.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="""set network profiles zone-protection UNTRUST-PROTECT flood tcp-syn enable yes
set network profiles zone-protection UNTRUST-PROTECT flood tcp-syn red threshold 5000
set network profiles zone-protection UNTRUST-PROTECT flood tcp-syn activate threshold 10000
set network zone untrust network zone-protection-profile UNTRUST-PROTECT""",
            tags=["zone-protection", "flood-protection", "paloalto"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Zone Protection Profiles not configured. Device is exposed to reconnaissance and flood attacks."
        )]
        
        return finding


class PaloAltoLogForwardingRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="PANOS-NET-002",
            control_name="Configure Log Forwarding to SIEM",
            framework=FrameworkEnum.NIST,
            severity=SeverityEnum.MEDIUM,
            title="Log Forwarding Profile Not Configured",
            description="Without log forwarding, security events are only stored locally and may not be correlated with other devices in a SIEM.",
            impact="Delayed threat detection. Inability to correlate events across devices.",
            remediation_summary="Configure a Log Forwarding Profile and apply it to security policy rules."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_log_forwarding = bool(re.search(r"log-forwarding", raw_config, re.IGNORECASE))
        if has_log_forwarding:
            return None
        
        config_evidence = "No log-forwarding profile configured on security policies"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="security policies",
            confidence_score=0.80,
            risk_score=5.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="set shared log-forwarding SIEM-FORWARD syslog SIEM-SERVER\nset rulebase security rules <rule-name> log-setting SIEM-FORWARD",
            tags=["logging", "siem", "paloalto"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Log forwarding not configured. Security events not sent to SIEM for correlation."
        )]
        
        return finding


# ─── Arista-Specific Rules ────────────────────────────────────────────────────

class AristaManagementAPIRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="ARISTA-NET-001",
            control_name="Restrict eAPI Access",
            framework=FrameworkEnum.CIS,
            severity=SeverityEnum.HIGH,
            title="eAPI HTTP Server Exposed",
            description="Arista's eAPI over HTTP exposes management interface without encryption, allowing credential theft.",
            impact="eAPI credentials captured can allow full device configuration control.",
            remediation_summary="Disable HTTP for eAPI and use HTTPS only with ACL restrictions."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        has_http_eapi = bool(re.search(r"protocol http$", raw_config, re.MULTILINE | re.IGNORECASE))
        
        if not has_http_eapi:
            return None
        
        config_evidence = "management api http-commands\n   protocol http (unencrypted eAPI access)"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="management api http-commands",
            confidence_score=0.92,
            risk_score=7.5,
            remediation_summary=self.remediation_summary,
            remediation_commands="""management api http-commands
   no protocol http
   protocol https ssl profile EAPI-SSL
   no shutdown""",
            tags=["eapi", "http", "management-interface", "arista"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="Arista eAPI accessible over unencrypted HTTP. All API calls including auth tokens are in plaintext."
        )]
        
        return finding


# ─── Universal Rules (apply to any vendor) ────────────────────────────────────

class UniversalNoLoggingRule(ComplianceRule):
    def __init__(self):
        super().__init__(
            control_id="UNIVERSAL-001",
            control_name="Configure Centralized Logging",
            framework=FrameworkEnum.ISO27001,
            severity=SeverityEnum.MEDIUM,
            title="No Centralized Syslog Configuration Detected",
            description="Centralized logging is essential for security monitoring, incident response, and audit compliance.",
            impact="Security events and configuration changes are not forwarded to a SIEM, impeding threat detection.",
            remediation_summary="Configure syslog forwarding to a centralized logging server or SIEM platform."
        )

    def check(self, nsir: NSIR, raw_config: str, audit_id: str) -> Optional[Finding]:
        if nsir.logging_servers or nsir.logging_enabled:
            return None
        
        config_evidence = "No remote syslog/logging server configured"
        
        finding = Finding(
            finding_id=generate_id(),
            audit_id=audit_id,
            device_id=nsir.device_id,
            vendor=nsir.vendor,
            control_id=self.control_id,
            control_name=self.control_name,
            framework=self.framework,
            severity=self.severity,
            title=self.title,
            description=self.description,
            impact=self.impact,
            config_evidence=config_evidence,
            config_reference="logging configuration",
            confidence_score=0.90,
            risk_score=5.0,
            remediation_summary=self.remediation_summary,
            remediation_commands="Configure syslog forwarding to SIEM server",
            tags=["logging", "monitoring", "siem", "iso27001"]
        )
        
        finding.evidence = [Evidence(
            evidence_id=generate_id(),
            finding_id=finding.finding_id,
            config_line=config_evidence,
            explanation="No centralized logging configured. Required by ISO 27001 A.12.4.1 and NIST AU family controls."
        )]
        
        return finding


# ─── Rule Registry ────────────────────────────────────────────────────────────

VENDOR_RULES: Dict[str, List[ComplianceRule]] = {
    VendorEnum.CISCO_IOS: [
        CiscoTelnetEnabledRule(),
        CiscoSSHv1Rule(),
        CiscoSNMPv1v2Rule(),
        CiscoHTTPServerRule(),
        CiscoNoPasswordEncryptionRule(),
        CiscoNoLoginBannerRule(),
        CiscoNTPNotConfiguredRule(),
        CiscoNoLoggingRule(),
        CiscoIPSourceRouteRule(),
        CiscoWeakEnablePasswordRule(),
    ],
    VendorEnum.CISCO_IOS_XE: [
        CiscoTelnetEnabledRule(),
        CiscoSSHv1Rule(),
        CiscoSNMPv1v2Rule(),
        CiscoHTTPServerRule(),
        CiscoNoPasswordEncryptionRule(),
        CiscoNoLoginBannerRule(),
        CiscoNTPNotConfiguredRule(),
        CiscoNoLoggingRule(),
        CiscoIPSourceRouteRule(),
    ],
    VendorEnum.JUNIPER_JUNOS: [
        JuniperTelnetRule(),
        JuniperSNMPPublicRule(),
        UniversalNoLoggingRule(),
    ],
    VendorEnum.FORTINET_FORTIOS: [
        FortinetHTTPAdminRule(),
        FortinetWeakPasswordPolicyRule(),
        UniversalNoLoggingRule(),
    ],
    VendorEnum.PALO_ALTO: [
        PaloAltoZoneProtectionRule(),
        PaloAltoLogForwardingRule(),
    ],
    VendorEnum.ARISTA_EOS: [
        AristaManagementAPIRule(),
        UniversalNoLoggingRule(),
    ],
    VendorEnum.SONIC: [
        UniversalNoLoggingRule(),
    ],
    VendorEnum.GENERIC: [
        UniversalNoLoggingRule(),
    ],
}


# ─── Main Compliance Engine ───────────────────────────────────────────────────

def run_compliance_checks(
    nsir: NSIR, 
    raw_config: str, 
    audit_id: str,
    frameworks: Optional[List[FrameworkEnum]] = None
) -> List[Finding]:
    """
    Run all applicable compliance checks for a vendor
    Returns list of findings
    """
    findings = []
    rules = VENDOR_RULES.get(nsir.vendor, [])
    
    # Also add universal rules if not already included
    universal_rules = VENDOR_RULES.get(VendorEnum.GENERIC, [])
    rule_ids = {r.control_id for r in rules}
    for rule in universal_rules:
        if rule.control_id not in rule_ids:
            rules.append(rule)
    
    logger.info(f"Running {len(rules)} compliance rules for {nsir.vendor} device {nsir.hostname}")
    
    for rule in rules:
        try:
            # Filter by framework if specified
            if frameworks and rule.framework not in frameworks:
                continue
            
            finding = rule.check(nsir, raw_config, audit_id)
            if finding:
                findings.append(finding)
                logger.debug(f"Finding: [{finding.severity}] {finding.title}")
        except Exception as e:
            logger.error(f"Rule {rule.control_id} failed: {e}")
    
    logger.info(f"Compliance check complete: {len(findings)} findings")
    return findings


def calculate_compliance_score(findings: List[Finding]) -> float:
    """Calculate compliance score (0-100) based on findings"""
    if not findings:
        return 95.0  # No findings = high compliance (not perfect since we might not have checked everything)
    
    severity_weights = {
        SeverityEnum.CRITICAL: 10.0,
        SeverityEnum.HIGH: 7.0,
        SeverityEnum.MEDIUM: 4.0,
        SeverityEnum.LOW: 1.5,
        SeverityEnum.INFO: 0.5,
    }
    
    total_deduction = sum(severity_weights.get(f.severity, 0) for f in findings)
    score = max(0.0, 100.0 - total_deduction)
    return round(score, 1)


def calculate_risk_score(findings: List[Finding]) -> float:
    """Calculate aggregate risk score (0-10)"""
    if not findings:
        return 1.0
    
    # Weighted average of risk scores, weighted by severity
    severity_weights = {
        SeverityEnum.CRITICAL: 4.0,
        SeverityEnum.HIGH: 3.0,
        SeverityEnum.MEDIUM: 2.0,
        SeverityEnum.LOW: 1.0,
        SeverityEnum.INFO: 0.5,
    }
    
    total_weight = sum(severity_weights.get(f.severity, 1.0) for f in findings)
    weighted_score = sum(
        f.risk_score * severity_weights.get(f.severity, 1.0) 
        for f in findings
    )
    
    if total_weight == 0:
        return 0.0
    
    raw_score = weighted_score / total_weight
    return round(min(10.0, raw_score), 1)
