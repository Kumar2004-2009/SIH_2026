"""
NETRA Configuration Sanitizer & Ingestion Security
Masks sensitive credentials, pre-shared keys, passwords, and tokens before storage/processing
"""
import re
from typing import Tuple, Dict, List


SENSITIVE_PATTERNS = [
    # Cisco secrets and passwords
    (r"(enable\s+secret\s+\d+\s+)\S+", r"\1[REDACTED_SECRET]"),
    (r"(enable\s+password\s+\d+\s+)\S+", r"\1[REDACTED_PASSWORD]"),
    (r"(password\s+\d+\s+)\S+", r"\1[REDACTED_PASSWORD]"),
    (r"(username\s+\S+\s+(?:privilege\s+\d+\s+)?(?:secret|password)\s+(?:\d+\s+)?)\S+", r"\1[REDACTED_CREDENTIAL]"),
    (r"(snmp-server\s+community\s+)(\S+)", r"\1[REDACTED_COMMUNITY]"),
    (r"(radius-server\s+key\s+(?:\d+\s+)?)\S+", r"\1[REDACTED_KEY]"),
    (r"(tacacs-server\s+key\s+(?:\d+\s+)?)\S+", r"\1[REDACTED_KEY]"),
    (r"(pre-shared-key\s+(?:hex\s+)?)\S+", r"\1[REDACTED_PSK]"),
    (r"(wpa-preshared-key\s+(?:hex\s+)?)\S+", r"\1[REDACTED_PSK]"),
    
    # Juniper
    (r"(encrypted-password\s+)\"[^\"]+\"", r'\1"[REDACTED_HASH]"'),
    (r"(authentication-key\s+)\"[^\"]+\"", r'\1"[REDACTED_KEY]"'),
    (r"(community\s+)(\S+)", r"\1[REDACTED_COMMUNITY]"),
    
    # Fortinet
    (r"(set\s+password\s+)\S+", r"\1[REDACTED_PASSWORD]"),
    (r"(set\s+pre-shared-key\s+)\S+", r"\1[REDACTED_PSK]"),
    (r"(set\s+private-key\s+)\"[^\"]+\"", r'\1"[REDACTED_KEY]"'),
    
    # Generic Tokens/Keys
    (r"(api[_-]?key\s*[:=]\s*['\"]?)[A-Za-z0-9_\-]{16,}['\"]?", r"\1[REDACTED_API_KEY]"),
    (r"(private[_-]?key\s*[:=]\s*['\"]?)[A-Za-z0-9+/=]{20,}['\"]?", r"\1[REDACTED_PRIVATE_KEY]"),
]


def sanitize_config(raw_config: str) -> Tuple[str, int]:
    """
    Sanitize sensitive information from device configuration.
    Returns: (sanitized_config, count_of_redactions)
    """
    sanitized = raw_config
    redaction_count = 0
    
    for pattern, repl in SENSITIVE_PATTERNS:
        matches = len(re.findall(pattern, sanitized, re.IGNORECASE | re.MULTILINE))
        if matches > 0:
            sanitized = re.sub(pattern, repl, sanitized, flags=re.IGNORECASE | re.MULTILINE)
            redaction_count += matches
            
    return sanitized, redaction_count
