from fastapi import APIRouter
from app.services.agent_sla import run_sla_watchdog
from app.services.agent_duplicate import run_duplicate_merger

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("/sla-watchdog")
async def trigger_sla_watchdog():
    """
    Trigger the SLA Watchdog agent.
    In production, this endpoint should be protected (e.g., via a secret token)
    and called by Google Cloud Scheduler every 6 hours.
    """
    result = run_sla_watchdog()
    return result

@router.post("/duplicate-merger")
async def trigger_duplicate_merger():
    """
    Trigger the Duplicate Merger agent.
    In production, this is called by Cloud Scheduler every 30 minutes.
    """
    result = run_duplicate_merger()
    return result

from app.services.agent_predictive import run_predictive_engine
from app.services.agent_digest import run_weekly_digest

@router.post("/predictive-engine")
async def trigger_predictive_engine():
    """
    Trigger Agent 4: Predictive Engine.
    Runs weekly.
    """
    return run_predictive_engine()

@router.post("/weekly-digest")
async def trigger_weekly_digest():
    """
    Trigger Agent 5: Weekly Digest Generator.
    Runs every Monday at 8 AM.
    """
    return run_weekly_digest()
