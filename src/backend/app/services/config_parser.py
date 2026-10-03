"""
NETRA Multi-Vendor Configuration Parser
Parses vendor-specific configs into NSIR (Network Security Intermediate Representation)
"""
import re
import hashlib
from typing import Dict, List, Optional, Any
from loguru import logger

from app.models.models import (
    NSIR, NSIRInterface, NSIRACLEntry, NSIRService,
    NSIRAuthentication, NSIREncryption, VendorEnum
)


class BaseParser:
    """Base class for all vendor parsers"""
    
    def __init__(self, config: str, device_id: str):
        self.config = config
        self.device_id = device_id
        self.lines = config.splitlines()
    
    def parse(self) -> NSIR:
        raise NotImplementedError
    
    def find_lines(self, pattern: str, flags=re.IGNORECASE) -> List[tuple]:
        """Find all lines matching a pattern, return (line_num, line) tuples"""
        results = []
        for i, line in enumerate(self.lines):
            if re.search(pattern, line, flags):
                results.append((i + 1, line.strip()))
        return results
    
    def extract_value(self, pattern: str, default=None):
        """Extract first capture group from config"""
        match = re.search(pattern, self.config, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
        return default


class CiscoIOSParser(BaseParser):
    """Parser for Cisco IOS and IOS-XE configurations"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.CISCO_IOS,
            hostname=self._get_hostname(),
        )
        
        nsir.interfaces = self._parse_interfaces()
        nsir.acl_entries = self._parse_acls()
        nsir.services = self._parse_services()
        nsir.authentication = self._parse_authentication()
        
        # SSH/Telnet
        nsir.ssh_enabled = bool(re.search(r"^ip ssh version", self.config, re.MULTILINE))
        nsir.telnet_enabled = self._check_telnet()
        
        # HTTP
        nsir.http_enabled = bool(re.search(r"^ip http server$", self.config, re.MULTILINE))
        nsir.https_enabled = bool(re.search(r"^ip http secure-server", self.config, re.MULTILINE))
        
        # SNMP
        nsir.snmp_enabled = bool(re.search(r"^snmp-server", self.config, re.MULTILINE))
        snmp_community = re.search(r"^snmp-server community (\S+)", self.config, re.MULTILINE)
        if snmp_community:
            nsir.snmp_community = snmp_community.group(1)
            nsir.snmp_version = "v2c"
        
        snmp_v3 = bool(re.search(r"snmp-server group.*v3", self.config, re.IGNORECASE | re.MULTILINE))
        if snmp_v3:
            nsir.snmp_version = "v3"
        
        # Logging
        nsir.logging_enabled = bool(re.search(r"^logging \d+\.\d+", self.config, re.MULTILINE))
        log_servers = re.findall(r"^logging (\d+\.\d+\.\d+\.\d+)", self.config, re.MULTILINE)
        nsir.logging_servers = log_servers
        
        # NTP
        ntp_servers = re.findall(r"^ntp server (\S+)", self.config, re.MULTILINE)
        nsir.ntp_servers = ntp_servers
        
        # Banners
        banner_login = re.search(r"banner login (.+?)(?:^!|\Z)", self.config, re.DOTALL | re.MULTILINE)
        if banner_login:
            nsir.login_banner = banner_login.group(1)[:200]
        
        # Password encryption
        nsir.service_password_encryption = bool(
            re.search(r"^service password-encryption", self.config, re.MULTILINE)
        )
        nsir.enable_password_encrypted = bool(
            re.search(r"^enable secret", self.config, re.MULTILINE)
        )
        
        # Routing
        protocols = []
        for proto in ["ospf", "eigrp", "bgp", "rip", "isis"]:
            if re.search(rf"^router {proto}", self.config, re.MULTILINE | re.IGNORECASE):
                protocols.append(proto.upper())
        nsir.routing_protocols = protocols
        
        return nsir
    
    def _get_hostname(self) -> str:
        return self.extract_value(r"^hostname\s+(\S+)", "unknown-cisco")
    
    def _parse_interfaces(self) -> List[NSIRInterface]:
        interfaces = []
        
        # Find interface blocks
        pattern = re.compile(
            r'^interface\s+([\w/\.]+)\n((?:(?!^interface|^!end).+\n?)*)',
            re.MULTILINE
        )
        
        for match in pattern.finditer(self.config):
            intf_name = match.group(1)
            intf_body = match.group(2)
            
            intf = NSIRInterface(name=intf_name)
            
            ip_match = re.search(r'ip address (\S+)\s+(\S+)', intf_body)
            if ip_match:
                intf.ip_address = ip_match.group(1)
                intf.subnet_mask = ip_match.group(2)
            
            desc_match = re.search(r'description\s+(.+)', intf_body)
            if desc_match:
                intf.description = desc_match.group(1).strip()
            
            intf.shutdown = bool(re.search(r'^\s*shutdown', intf_body, re.MULTILINE))
            
            ag_in = re.search(r'ip access-group (\S+) in', intf_body)
            if ag_in:
                intf.access_group_in = ag_in.group(1)
            
            ag_out = re.search(r'ip access-group (\S+) out', intf_body)
            if ag_out:
                intf.access_group_out = ag_out.group(1)
            
            vlan_match = re.search(r'switchport access vlan (\d+)', intf_body)
            if vlan_match:
                intf.vlan = int(vlan_match.group(1))
            
            interfaces.append(intf)
        
        return interfaces
    
    def _parse_acls(self) -> List[NSIRACLEntry]:
        acl_entries = []
        
        # Extended ACLs
        ext_pattern = re.compile(
            r'^ip access-list extended\s+(\S+)\n((?:(?!^ip access-list|^!end).+\n?)*)',
            re.MULTILINE
        )
        
        for match in ext_pattern.finditer(self.config):
            acl_name = match.group(1)
            body = match.group(2)
            
            for line in body.splitlines():
                line = line.strip()
                ace_match = re.match(
                    r'(\d+)?\s*(permit|deny)\s+(\S+)(?:\s+(.+))?', line
                )
                if ace_match:
                    entry = NSIRACLEntry(
                        acl_name=acl_name,
                        sequence=int(ace_match.group(1)) if ace_match.group(1) else None,
                        action=ace_match.group(2),
                        protocol=ace_match.group(3),
                        source=ace_match.group(4) or "any",
                        log=bool(re.search(r'\blog\b', line))
                    )
                    acl_entries.append(entry)
        
        # Standard ACLs
        std_pattern = re.compile(
            r'^ip access-list standard\s+(\S+)\n((?:(?!^ip access-list|^!end).+\n?)*)',
            re.MULTILINE
        )
        
        for match in std_pattern.finditer(self.config):
            acl_name = match.group(1)
            body = match.group(2)
            
            for line in body.splitlines():
                line = line.strip()
                ace_match = re.match(r'(\d+)?\s*(permit|deny)\s+(.+)', line)
                if ace_match:
                    entry = NSIRACLEntry(
                        acl_name=acl_name,
                        action=ace_match.group(2),
                        protocol="ip",
                        source=ace_match.group(3),
                    )
                    acl_entries.append(entry)
        
        return acl_entries
    
    def _parse_services(self) -> List[NSIRService]:
        services = []
        service_checks = [
            ("cdp", r"^(no )?cdp run", True),
            ("lldp", r"^(no )?lldp run", True),
            ("finger", r"^(no )?service finger", False),
            ("tcp-small-servers", r"^(no )?service tcp-small-servers", False),
            ("udp-small-servers", r"^(no )?service udp-small-servers", False),
            ("ip_source_routing", r"^(no )?ip source-route", True),
            ("ip_directed_broadcast", r"^(no )?ip directed-broadcast", True),
            ("proxy_arp", r"no ip proxy-arp", False),
        ]
        
        for name, pattern, default_enabled in service_checks:
            match = re.search(pattern, self.config, re.MULTILINE | re.IGNORECASE)
            if match:
                enabled = not match.group(0).strip().startswith("no")
            else:
                enabled = default_enabled
            
            services.append(NSIRService(service_name=name, enabled=enabled))
        
        return services
    
    def _parse_authentication(self) -> Optional[NSIRAuthentication]:
        method = "local"
        servers = []
        
        tacacs_servers = re.findall(r"tacacs-server host (\S+)", self.config, re.IGNORECASE)
        radius_servers = re.findall(r"radius-server host (\S+)", self.config, re.IGNORECASE)
        
        if tacacs_servers:
            method = "tacacs"
            servers = tacacs_servers
        elif radius_servers:
            method = "radius"
            servers = radius_servers
        
        return NSIRAuthentication(method=method, servers=servers)
    
    def _check_telnet(self) -> bool:
        """Check if telnet is accessible on VTY lines"""
        vty_sections = re.findall(
            r'line vty.*?\n(.*?)(?=line |!|\Z)',
            self.config,
            re.DOTALL | re.MULTILINE
        )
        
        for section in vty_sections:
            if re.search(r'transport input.*telnet', section, re.IGNORECASE):
                return True
            if not re.search(r'transport input', section):
                return True  # Default allows telnet
        
        return False


class JuniperJunOSParser(BaseParser):
    """Parser for Juniper JunOS configurations"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.JUNIPER_JUNOS,
            hostname=self._get_hostname(),
        )
        
        nsir.services = self._parse_services()
        nsir.ssh_enabled = bool(re.search(r"set system services ssh", self.config))
        nsir.telnet_enabled = bool(re.search(r"set system services telnet", self.config))
        nsir.http_enabled = bool(re.search(r"set system services web-management http", self.config))
        nsir.https_enabled = bool(re.search(r"set system services web-management https", self.config))
        nsir.snmp_enabled = bool(re.search(r"set snmp", self.config))
        
        snmp_community = re.search(r"set snmp community (\S+)", self.config)
        if snmp_community:
            nsir.snmp_community = snmp_community.group(1)
        
        ntp_servers = re.findall(r"set system ntp server (\S+)", self.config)
        nsir.ntp_servers = ntp_servers
        
        log_hosts = re.findall(r"set system syslog host (\S+)", self.config)
        nsir.logging_servers = log_hosts
        nsir.logging_enabled = bool(log_hosts)
        
        routing_protocols = []
        for proto in ["ospf", "bgp", "isis", "rip"]:
            if re.search(rf"set protocols {proto}", self.config, re.IGNORECASE):
                routing_protocols.append(proto.upper())
        nsir.routing_protocols = routing_protocols
        
        return nsir
    
    def _get_hostname(self) -> str:
        return self.extract_value(r"set system host-name\s+(\S+)", "unknown-juniper")
    
    def _parse_services(self) -> List[NSIRService]:
        services = [
            NSIRService(
                service_name="telnet",
                enabled=bool(re.search(r"set system services telnet", self.config))
            ),
            NSIRService(
                service_name="ssh",
                enabled=bool(re.search(r"set system services ssh", self.config))
            ),
        ]
        return services


class FortinetFortiOSParser(BaseParser):
    """Parser for Fortinet FortiOS configurations"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.FORTINET_FORTIOS,
            hostname=self._get_hostname(),
        )
        
        nsir.ssh_enabled = bool(re.search(r"set admintimeout", self.config))
        nsir.http_enabled = self._check_http()
        nsir.https_enabled = bool(re.search(r"set admin-https", self.config) or 
                                   re.search(r"set https enable", self.config))
        nsir.snmp_enabled = bool(re.search(r"config system snmp", self.config))
        
        nsir.services = self._parse_services()
        nsir.ntp_servers = re.findall(r"set ntpserver\s+\"?(\S+?)\"?$", self.config, re.MULTILINE)
        
        log_servers = re.findall(r"set server\s+\"?(\S+?)\"?$", self.config, re.MULTILINE)
        nsir.logging_servers = log_servers[:5]
        nsir.logging_enabled = bool(log_servers)
        
        return nsir
    
    def _get_hostname(self) -> str:
        return self.extract_value(r'set hostname\s+"?(\S+?)"?$', "unknown-fortinet")
    
    def _check_http(self) -> bool:
        match = re.search(r"set admin-http\s+(\w+)", self.config)
        if match:
            return match.group(1).lower() == "enable"
        return False
    
    def _parse_services(self) -> List[NSIRService]:
        services = []
        
        http_match = re.search(r"set admin-http\s+(\w+)", self.config)
        if http_match:
            services.append(NSIRService(
                service_name="http_admin",
                enabled=http_match.group(1).lower() == "enable"
            ))
        
        return services


class PaloAltoParser(BaseParser):
    """Parser for Palo Alto PAN-OS configurations"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.PALO_ALTO,
            hostname=self._get_hostname(),
        )
        
        nsir.ssh_enabled = bool(re.search(r"ssh", self.config, re.IGNORECASE))
        nsir.http_enabled = bool(re.search(r'<http>', self.config))
        nsir.https_enabled = bool(re.search(r'<https>', self.config))
        nsir.snmp_enabled = bool(re.search(r'<snmp>', self.config, re.IGNORECASE))
        
        ntp_servers = re.findall(r'<member>(\d+\.\d+\.\d+\.\d+)</member>', self.config)
        nsir.ntp_servers = ntp_servers[:3]
        
        nsir.logging_enabled = bool(re.search(r'syslog', self.config, re.IGNORECASE))
        
        return nsir
    
    def _get_hostname(self) -> str:
        match = re.search(r'<hostname>([^<]+)</hostname>', self.config)
        if match:
            return match.group(1)
        return self.extract_value(r'set deviceconfig system hostname\s+(\S+)', "unknown-paloalto")


class AristaEOSParser(BaseParser):
    """Parser for Arista EOS configurations"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.ARISTA_EOS,
            hostname=self._get_hostname(),
        )
        
        nsir.ssh_enabled = bool(re.search(r"^ip ssh", self.config, re.MULTILINE))
        nsir.http_enabled = bool(re.search(r"no shutdown.*http", self.config, re.IGNORECASE))
        nsir.snmp_enabled = bool(re.search(r"^snmp-server", self.config, re.MULTILINE))
        
        ntp_servers = re.findall(r"^ntp server (\S+)", self.config, re.MULTILINE)
        nsir.ntp_servers = ntp_servers
        
        log_hosts = re.findall(r"^logging host (\S+)", self.config, re.MULTILINE)
        nsir.logging_servers = log_hosts
        nsir.logging_enabled = bool(log_hosts)
        
        nsir.service_password_encryption = bool(
            re.search(r"^service password-encryption", self.config, re.MULTILINE)
        )
        
        return nsir
    
    def _get_hostname(self) -> str:
        return self.extract_value(r"^hostname\s+(\S+)", "unknown-arista")


class SONiCParser(BaseParser):
    """Parser for SONiC configurations"""
    
    def parse(self) -> NSIR:
        import json
        
        hostname = "unknown-sonic"
        try:
            config_db = json.loads(self.config)
            meta = config_db.get("DEVICE_METADATA", {}).get("localhost", {})
            hostname = meta.get("hostname", "unknown-sonic")
        except Exception:
            hostname = self.extract_value(r'"hostname":\s*"([^"]+)"', "unknown-sonic")
        
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.SONIC,
            hostname=hostname,
        )
        
        nsir.ssh_enabled = True  # SONiC always has SSH
        nsir.snmp_enabled = bool(re.search(r'"SNMP"', self.config))
        nsir.logging_enabled = bool(re.search(r'"SYSLOG_SERVER"', self.config))
        
        return nsir


class GenericParser(BaseParser):
    """Fallback generic parser"""
    
    def parse(self) -> NSIR:
        nsir = NSIR(
            device_id=self.device_id,
            vendor=VendorEnum.GENERIC,
            hostname=self.extract_value(r"hostname\s+(\S+)", "unknown-device"),
        )
        
        nsir.ssh_enabled = bool(re.search(r"ssh", self.config, re.IGNORECASE))
        nsir.telnet_enabled = bool(re.search(r"telnet", self.config, re.IGNORECASE))
        nsir.snmp_enabled = bool(re.search(r"snmp", self.config, re.IGNORECASE))
        
        return nsir


def get_parser(vendor: VendorEnum, config: str, device_id: str) -> BaseParser:
    """Factory function to get the appropriate parser for a vendor"""
    parsers = {
        VendorEnum.CISCO_IOS: CiscoIOSParser,
        VendorEnum.CISCO_IOS_XE: CiscoIOSParser,
        VendorEnum.JUNIPER_JUNOS: JuniperJunOSParser,
        VendorEnum.FORTINET_FORTIOS: FortinetFortiOSParser,
        VendorEnum.PALO_ALTO: PaloAltoParser,
        VendorEnum.ARISTA_EOS: AristaEOSParser,
        VendorEnum.SONIC: SONiCParser,
        VendorEnum.GENERIC: GenericParser,
    }
    
    parser_class = parsers.get(vendor, GenericParser)
    return parser_class(config, device_id)


def parse_config(vendor: VendorEnum, config: str, device_id: str) -> NSIR:
    """Parse a configuration and return NSIR"""
    try:
        parser = get_parser(vendor, config, device_id)
        return parser.parse()
    except Exception as e:
        logger.error(f"Parsing failed for {vendor}: {e}")
        # Return minimal NSIR
        return NSIR(
            device_id=device_id,
            vendor=vendor,
            hostname="parse-error",
        )
