"""
adk_config.py
Google ADK configuration — model, session service, and runner setup.

All imports are wrapped in try/except so the app doesn't crash if google.adk
is not installed. ADK is an optional dependency — the legacy pipeline works
without it.
"""
import os

def _import_adk():
    """Lazy import ADK modules. Returns (LiteLlm, InMemorySessionService, Runner) or raises ImportError."""
    from google.adk.models.lite_llm import LiteLlm
    from google.adk.sessions import InMemorySessionService
    from google.adk.runners import Runner
    return LiteLlm, InMemorySessionService, Runner


def get_adk_model():
    """Create the shared ADK model instance backed by Groq."""
    LiteLlm, _, _ = _import_adk()
    model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    api_key = os.environ.get("GROQ_CLOUD_API", "")
    return LiteLlm(model=f"groq/{model_name}", api_key=api_key)


def get_session_service():
    """Create an in-memory session service. Replace with DB-backed for production."""
    _, InMemorySessionService, _ = _import_adk()
    return InMemorySessionService()


def get_runner(session_service, root_agent):
    """Create the ADK Runner that executes the workflow graph."""
    _, _, Runner = _import_adk()
    return Runner(
        agent=root_agent,
        session_service=session_service,
        app_name="beacon_brd",
    )


def is_adk_available() -> bool:
    """Check if google.adk is installed and importable."""
    try:
        _import_adk()
        return True
    except ImportError:
        return False
