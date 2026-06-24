import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.api import issues, agents
from app.services.agent_sla import run_sla_watchdog
from app.services.agent_duplicate import run_duplicate_merger
from app.services.agent_predictive import run_predictive_engine
from app.services.agent_digest import run_weekly_digest
import contextlib

scheduler = BackgroundScheduler()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule Agents (Accelerated for hackathon demo)
    scheduler.add_job(run_sla_watchdog, 'interval', minutes=2, id='sla_watchdog')
    scheduler.add_job(run_duplicate_merger, 'interval', minutes=5, id='duplicate_merger')
    # Weekly digest & predictive engines can be run less frequently, but for demo we run them every 30m
    scheduler.add_job(run_predictive_engine, 'interval', minutes=30, id='predictive_engine')
    scheduler.add_job(run_weekly_digest, 'interval', minutes=30, id='weekly_digest')
    
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="NagarSeva API",
    description="Backend API for NagarSeva Civic Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, specify domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to NagarSeva API. Use /docs to view Swagger documentation."}
