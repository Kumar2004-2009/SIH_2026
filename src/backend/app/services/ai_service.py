"""
NETRA AI Engine
Optional Google Gemini API integration for semantic interpretation, plain-English explanations,
and remediation reasoning. Provides high-fidelity deterministic fallbacks when AI is disabled/offline.
"""
from typing import Optional, Dict, Any
from loguru import logger
from app.core.config import settings

# Attempt import of google.generativeai
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def _get_gemini_model():
    if not GENAI_AVAILABLE or not settings.GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini AI: {e}")
        return None


async def explain_finding_ai(title: str, control_id: str, config_evidence: str, vendor: str) -> Dict[str, str]:
    """
    Generate plain-English explanation, attacker exploitation narrative, and business impact.
    """
    model = _get_gemini_model()
    if model and settings.AI_ENABLED:
        try:
            prompt = f"""You are NETRA, an NTRO-grade AI Network Security Auditor.
Explain the following network misconfiguration concisely for both a SOC analyst and CISO:
Vendor: {vendor}
Control ID: {control_id}
Title: {title}
Configuration Evidence:
{config_evidence}

Provide response in 3 structured paragraphs:
1. Executive Risk Summary
2. Attacker Exploitation Narrative
3. Remediation Strategy"""
            response = model.generate_content(prompt)
            if response and response.text:
                return {
                    "source": "Gemini-1.5-Flash",
                    "explanation": response.text.strip()
                }
        except Exception as e:
            logger.warning(f"Gemini API call failed, using fallback: {e}")

    # High-quality deterministic fallback
    return {
        "source": "NETRA-Deterministic-Intelligence",
        "explanation": (
            f"**Executive Risk Summary:** The control '{title}' ({control_id}) represents an active deviation "
            f"from established national hardening baselines. The device exposes services or credentials that violate "
            f"the principle of least privilege.\n\n"
            f"**Attacker Exploitation Narrative:** An adversary positioned within adjacent broadcast domains or pivoting "
            f"across border routers can leverage the unhardened setting evidenced by `{config_evidence.splitlines()[0] if config_evidence else 'misconfiguration'}` "
            f"to intercept management streams, forge administrative commands, or bypass security zones.\n\n"
            f"**Remediation Strategy:** Replace legacy plaintext transports with cryptographic alternatives (SSHv2, SNMPv3 authPriv), "
            f"constrain management plane access using explicit access-classes, and enforce AAA with centralized accounting."
        )
    }


async def interpret_unknown_command(command: str, vendor: str) -> Dict[str, Any]:
    """
    Semantic interpretation of unknown or vendor-specific proprietary configuration directives.
    """
    model = _get_gemini_model()
    if model and settings.AI_ENABLED:
        try:
            prompt = f"""Analyze this network configuration command:
Vendor: {vendor}
Command: {command}

Respond with JSON:
{{"purpose": "...", "security_impact": "low|medium|high", "recommendation": "..."}}"""
            response = model.generate_content(prompt)
            if response and response.text:
                import json
                cleaned = response.text.strip().replace("```json", "").replace("```", "")
                return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"AI command interpretation fallback used: {e}")

    return {
        "command": command,
        "vendor": vendor,
        "purpose": "Vendor-specific subsystem or telemetry parameter configuration",
        "security_impact": "medium",
        "recommendation": "Review against vendor hardening guidelines and ensure least privilege principle is applied."
    }
