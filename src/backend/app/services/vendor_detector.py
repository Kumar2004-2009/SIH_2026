"""
NETRA Vendor Detection Engine
Identifies the vendor of a network configuration
"""
import re
from app.models.models import VendorEnum


VENDOR_SIGNATURES = {
    VendorEnum.PALO_ALTO: [
        r"<config\s+version=",
        r"<mgt-config>",
        r"<vsys>",
        r"set deviceconfig",
        r"set network interface",
        r"<entry name=\"panorama",
        r"pan-os",
    ],
    VendorEnum.FORTINET_FORTIOS: [
        r"^config system global",
        r"^config firewall policy",
        r"^config vpn ssl settings",
        r"FortiOS",
        r"fortinet",
        r"FGT-",
        r"^set vdom",
        r"^config system interface",
        r"fortigate",
    ],
    VendorEnum.JUNIPER_JUNOS: [
        r"^set system host-name",
        r"^set interfaces",
        r"^set security",
        r"juniper",
        r"JunOS",
        r"^set policy-options",
        r"^set routing-options",
        r"## Last changed:",
        r"^set firewall family",
    ],
    VendorEnum.ARISTA_EOS: [
        r"^!.*Arista",
        r"EOS version",
        r"^management api http-commands",
        r"arista",
        r"vEOS",
        r"^daemon TerminAttr",
        r"^management cvx",
    ],
    VendorEnum.SONIC: [
        r"SONiC",
        r"sonic",
        r'"DEVICE_METADATA"',
        r'"BGP_NEIGHBOR"',
        r'"PORT_CHANNEL"',
        r"frr_mgmt_framework_config",
    ],
    VendorEnum.CISCO_IOS_XE: [
        r"IOS-XE",
        r"Cisco IOS XE",
        r"^crypto pki",
        r"^platform qos",
        r"^license udi",
        r"^netconf-yang",
    ],
    VendorEnum.CISCO_IOS: [
        r"^version \d+\.\d+",
        r"^hostname\s+\S+",
        r"^ip access-list",
        r"^interface (GigabitEthernet|FastEthernet|Serial|Loopback)",
        r"^service password-encryption",
        r"^line vty",
        r"^enable secret",
        r"cisco",
    ],
}


def detect_vendor(config_text: str) -> VendorEnum:
    """
    Detect the vendor of a network configuration file
    Returns the most likely vendor based on signature matching
    """
    config_lower = config_text.lower()
    scores = {vendor: 0 for vendor in VendorEnum}
    
    for vendor, patterns in VENDOR_SIGNATURES.items():
        for pattern in patterns:
            matches = len(re.findall(pattern, config_text, re.IGNORECASE | re.MULTILINE))
            scores[vendor] += matches
    
    # Get vendor with highest score
    best_vendor = max(scores, key=scores.get)
    
    # If no matches found, return generic
    if scores[best_vendor] == 0:
        return VendorEnum.GENERIC
    
    # Disambiguation: IOS vs IOS-XE
    if best_vendor == VendorEnum.CISCO_IOS and scores.get(VendorEnum.CISCO_IOS_XE, 0) > 0:
        best_vendor = VendorEnum.CISCO_IOS_XE
    
    return best_vendor


def get_vendor_display_name(vendor: VendorEnum) -> str:
    names = {
        VendorEnum.CISCO_IOS: "Cisco IOS",
        VendorEnum.CISCO_IOS_XE: "Cisco IOS-XE",
        VendorEnum.JUNIPER_JUNOS: "Juniper JunOS",
        VendorEnum.FORTINET_FORTIOS: "Fortinet FortiOS",
        VendorEnum.PALO_ALTO: "Palo Alto PAN-OS",
        VendorEnum.ARISTA_EOS: "Arista EOS",
        VendorEnum.SONIC: "SONiC",
        VendorEnum.GENERIC: "Generic",
    }
    return names.get(vendor, "Unknown")
