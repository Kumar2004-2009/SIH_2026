"""
NETRA Pydantic Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class VendorEnum(str, Enum):
    CISCO_IOS = "cisco_ios"
    CISCO_IOS_XE = "cisco_ios_xe"
    JUNIPER_JUNOS = "juniper_junos"
    FORTINET_FORTIOS = "fortinet_fortios"
    PALO_ALTO = "palo_alto"
    ARISTA_EOS = "arista_eos"
    SONIC = "sonic"
    GENERIC = "generic"


class SeverityEnum(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class StatusEnum(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    REMEDIATED = "remediated"
    ACCEPTED = "accepted"
    FALSE_POSITIVE = "false_positive"


class AuditStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FrameworkEnum(str, Enum):
    CIS = "CIS"
    NIST = "NIST"
    STIG = "STIG"
    ISO27001 = "ISO27001"
    PCI_DSS = "PCI-DSS"
    NETRA = "NETRA"


class DeviceTypeEnum(str, Enum):
    ROUTER = "router"
    SWITCH = "switch"
    FIREWALL = "firewall"
    LOAD_BALANCER = "load_balancer"
    UNKNOWN = "unknown"


# ─── Device Models ────────────────────────────────────────────────────────────

class DeviceBase(BaseModel):
    hostname: str
    vendor: VendorEnum
    device_type: DeviceTypeEnum = DeviceTypeEnum.UNKNOWN
    model: Optional[str] = None
    os_version: Optional[str] = None
    management_ip: Optional[str] = None
    location: Optional[str] = None
    criticality: str = "medium"  # low, medium, high, critical
    tags: List[str] = []
    notes: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class Device(DeviceBase):
    device_id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_audit_at: Optional[datetime] = None
    total_findings: int = 0
    risk_score: float = 0.0
    compliance_score: float = 0.0


# ─── Configuration Models ─────────────────────────────────────────────────────

class ConfigurationBase(BaseModel):
    device_id: str
    raw_config: str
    vendor: VendorEnum
    filename: Optional[str] = None


class Configuration(ConfigurationBase):
    config_id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    hash: Optional[str] = None
    size_bytes: int = 0
    line_count: int = 0


# ─── NSIR (Network Security Intermediate Representation) ──────────────────────

class NSIRInterface(BaseModel):
    name: str
    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = None
    description: Optional[str] = None
    shutdown: bool = False
    access_group_in: Optional[str] = None
    access_group_out: Optional[str] = None
    vlan: Optional[int] = None
    duplex: Optional[str] = None
    speed: Optional[str] = None


class NSIRACLEntry(BaseModel):
    acl_name: str
    sequence: Optional[int] = None
    action: str  # permit/deny
    protocol: Optional[str] = None
    source: Optional[str] = None
    destination: Optional[str] = None
    port: Optional[str] = None
    log: bool = False


class NSIRService(BaseModel):
    service_name: str
    enabled: bool
    port: Optional[int] = None
    description: Optional[str] = None


class NSIRAuthentication(BaseModel):
    method: str  # local, radius, tacacs, ldap
    servers: List[str] = []
    fallback: Optional[str] = None


class NSIREncryption(BaseModel):
    protocol: Optional[str] = None
    strength: Optional[str] = None  # weak, medium, strong
    algorithms: List[str] = []


class NSIR(BaseModel):
    """Network Security Intermediate Representation"""
    device_id: str
    vendor: VendorEnum
    hostname: str
    
    # Network Structure
    interfaces: List[NSIRInterface] = []
    
    # Access Control
    acl_entries: List[NSIRACLEntry] = []
    
    # Services
    services: List[NSIRService] = []
    
    # Authentication
    authentication: Optional[NSIRAuthentication] = None
    
    # Encryption
    encryption: Optional[NSIREncryption] = None
    
    # Security Features
    ssh_enabled: bool = False
    telnet_enabled: bool = False
    http_enabled: bool = False
    https_enabled: bool = False
    snmp_enabled: bool = False
    snmp_version: Optional[str] = None
    snmp_community: Optional[str] = None
    
    # Routing
    routing_protocols: List[str] = []
    
    # Logging
    logging_enabled: bool = False
    logging_servers: List[str] = []
    
    # NTP
    ntp_servers: List[str] = []
    
    # Banners
    login_banner: Optional[str] = None
    motd_banner: Optional[str] = None
    
    # Passwords
    enable_password_encrypted: bool = False
    service_password_encryption: bool = False
    
    # Raw extracted data
    raw_sections: Dict[str, Any] = {}


# ─── Finding Models ───────────────────────────────────────────────────────────

class Evidence(BaseModel):
    evidence_id: str = Field(default_factory=generate_id)
    finding_id: str
    config_line: str
    line_number: Optional[int] = None
    context_before: Optional[str] = None
    context_after: Optional[str] = None
    explanation: Optional[str] = None


class FindingBase(BaseModel):
    audit_id: str
    device_id: str
    vendor: VendorEnum
    
    # Classification
    finding_id: str = Field(default_factory=generate_id)
    control_id: str
    control_name: str
    framework: FrameworkEnum
    severity: SeverityEnum
    
    # Description
    title: str
    description: str
    impact: str
    
    # Evidence
    config_evidence: str  # Exact config lines
    config_reference: Optional[str] = None  # Line number or section
    
    # Scores
    confidence_score: float = 0.8
    risk_score: float = 5.0
    cvss_score: Optional[float] = None
    
    # Remediation
    remediation_summary: str
    remediation_commands: Optional[str] = None
    
    # Context
    tags: List[str] = []
    references: List[str] = []
    false_positive_reason: Optional[str] = None


class Finding(FindingBase):
    status: StatusEnum = StatusEnum.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    evidence: List[Evidence] = []


class FindingUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    false_positive_reason: Optional[str] = None
    notes: Optional[str] = None


# ─── Audit Models ─────────────────────────────────────────────────────────────

class AuditCreate(BaseModel):
    device_id: Optional[str] = None
    raw_config: str
    vendor: Optional[str] = None
    filename: Optional[str] = None
    frameworks: List[FrameworkEnum] = [FrameworkEnum.CIS, FrameworkEnum.NIST]


class Audit(BaseModel):
    audit_id: str = Field(default_factory=generate_id)
    device_id: Optional[str] = None
    config_id: Optional[str] = None
    
    status: AuditStatusEnum = AuditStatusEnum.PENDING
    frameworks: List[FrameworkEnum] = []
    
    # Results
    total_findings: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    
    compliance_score: float = 0.0
    risk_score: float = 0.0
    
    # Metadata
    vendor_detected: Optional[VendorEnum] = None
    hostname_detected: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    
    error_message: Optional[str] = None


# ─── Remediation Models ───────────────────────────────────────────────────────

class RemediationStep(BaseModel):
    step_number: int
    description: str
    commands: str
    mode: Optional[str] = None  # e.g., "global config", "interface config"
    warning: Optional[str] = None


class RemediationPlan(BaseModel):
    remediation_id: str = Field(default_factory=generate_id)
    finding_id: str
    device_id: str
    vendor: VendorEnum
    
    title: str
    description: str
    
    # Before/After
    config_before: str
    config_after: str
    
    # Steps
    steps: List[RemediationStep] = []
    
    # Validation
    validation_commands: List[str] = []
    validation_expected: Optional[str] = None
    
    # Risk Assessment
    implementation_risk: str = "low"  # low, medium, high
    rollback_commands: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, simulated, validated, approved, applied
    simulation_result: Optional[str] = None
    validation_result: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None


# ─── Report Models ────────────────────────────────────────────────────────────

class Report(BaseModel):
    report_id: str = Field(default_factory=generate_id)
    audit_ids: List[str] = []
    device_ids: List[str] = []
    
    title: str
    report_type: str = "full"  # full, executive, technical, compliance
    
    # Summary
    total_devices: int = 0
    total_findings: int = 0
    overall_risk_score: float = 0.0
    compliance_percentage: float = 0.0
    
    severity_breakdown: Dict[str, int] = {}
    vendor_breakdown: Dict[str, int] = {}
    framework_breakdown: Dict[str, Any] = {}
    
    executive_summary: Optional[str] = None
    recommendations: List[str] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    generated_by: str = "NETRA Engine"


# ─── Security Graph Models ────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    node_type: str  # device, network, service, internet
    vendor: Optional[str] = None
    risk_score: float = 0.0
    criticality: str = "medium"
    properties: Dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    edge_type: str  # connected, routes_to, filters, exposes
    protocol: Optional[str] = None
    port: Optional[int] = None
    bidirectional: bool = False
    properties: Dict[str, Any] = {}


class SecurityGraph(BaseModel):
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    attack_paths: List[List[str]] = []
    risk_summary: Dict[str, Any] = {}


# ─── Drift Models ─────────────────────────────────────────────────────────────

class DriftEntry(BaseModel):
    drift_id: str = Field(default_factory=generate_id)
    device_id: str
    
    config_a_id: str
    config_b_id: str
    config_a_date: datetime
    config_b_date: datetime
    
    added_lines: List[str] = []
    removed_lines: List[str] = []
    changed_sections: List[str] = []
    
    drift_score: float = 0.0
    security_impact: str = "unknown"  # positive, negative, neutral, unknown
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Dashboard Models ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_devices: int = 0
    total_audits: int = 0
    total_findings: int = 0
    open_findings: int = 0
    
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    
    overall_compliance_score: float = 0.0
    overall_risk_score: float = 0.0
    
    vendor_breakdown: Dict[str, int] = {}
    severity_trend: List[Dict[str, Any]] = []
    top_risky_devices: List[Dict[str, Any]] = []
    recent_findings: List[Dict[str, Any]] = []
    recent_audits: List[Dict[str, Any]] = []
    framework_compliance: Dict[str, float] = {}
