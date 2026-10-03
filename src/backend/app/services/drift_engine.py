"""
NETRA Configuration Drift Engine
Compares baseline vs current configuration files, tracks modifications, and computes security drift scores
"""
import difflib
from typing import Dict, List, Any
from datetime import datetime
from app.models.models import DriftEntry, generate_id


def calculate_configuration_drift(
    device_id: str,
    config_a_id: str,
    config_b_id: str,
    config_a_text: str,
    config_b_text: str,
    config_a_date: datetime,
    config_b_date: datetime
) -> DriftEntry:
    lines_a = [line.strip() for line in config_a_text.splitlines() if line.strip() and not line.strip().startswith("!")]
    lines_b = [line.strip() for line in config_b_text.splitlines() if line.strip() and not line.strip().startswith("!")]

    differ = difflib.Differ()
    diff = list(differ.compare(lines_a, lines_b))

    added_lines = [line[2:] for line in diff if line.startswith('+ ')]
    removed_lines = [line[2:] for line in diff if line.startswith('- ')]

    total_changes = len(added_lines) + len(removed_lines)
    baseline_len = max(len(lines_a), 1)
    raw_drift_pct = min(100.0, (total_changes / baseline_len) * 100.0)

    # Detect high risk regressions in added/removed lines
    security_impact = "neutral"
    risk_additions = ["telnet", "http server", "permit any any", "community public", "no service password-encryption"]
    risk_removals = ["ssh version 2", "ip access-group", "login local", "service password-encryption", "ntp server"]

    has_degradation = any(any(kw in line.lower() for kw in risk_additions) for line in added_lines) or \
                      any(any(kw in line.lower() for kw in risk_removals) for line in removed_lines)

    if has_degradation:
        security_impact = "negative"
    elif len(added_lines) > 0 and any("ssh" in l.lower() or "secret" in l.lower() for l in added_lines):
        security_impact = "positive"

    return DriftEntry(
        drift_id=generate_id(),
        device_id=device_id,
        config_a_id=config_a_id,
        config_b_id=config_b_id,
        config_a_date=config_a_date,
        config_b_date=config_b_date,
        added_lines=added_lines[:50],  # cap for display
        removed_lines=removed_lines[:50],
        changed_sections=[f"Total modifications: {len(added_lines)} added, {len(removed_lines)} removed lines"],
        drift_score=round(raw_drift_pct, 1),
        security_impact=security_impact
    )
