import os
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import settings
from brightdata_client import BrightDataClient
from agent_engine import GTMResearchAgentPipeline

# Initialize FastAPI app with descriptive metadata
app = FastAPI(
    title="VEIN.intel API",
    description="Autonomous GTM and Competitor Intelligence Agent powered by Bright Data",
    version="1.0.0"
)

# Set up permissive CORS configuration for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits requests from local Vite servers (typically http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Bright Data Client
bd_client = BrightDataClient()

@app.get("/")
def read_root():
    """Health check index endpoint."""
    return {
        "status": "healthy",
        "app": "VEIN.intel Backend",
        "sandbox_mode": settings.is_sandbox_mode()
    }

@app.get("/api/test-credentials")
def test_credentials():
    """
    Endpoint for frontend to check the connectivity status of
    Bright Data and AI providers.
    """
    bd_status = bd_client.test_connections()
    ai_status = {
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
    }
    
    return {
        "brightdata": bd_status,
        "ai_providers": ai_status,
        "is_sandbox": settings.is_sandbox_mode()
    }

@app.get("/api/research/stream")
def research_stream(
    domain: str = Query(..., description="Target company domain (e.g., linear.app)"),
    focus: str = Query("General Outbound", description="Focus area for GTM research")
):
    """
    Main execution endpoint. Initiates the multi-agent intelligence pipeline
    and streams execution logs and research updates in real time using 
    Server-Sent Events (SSE).
    """
    if not domain:
        raise HTTPException(status_code=400, detail="Domain parameter is required.")

    # Initialize the research pipeline
    pipeline = GTMResearchAgentPipeline(domain=domain, focus_area=focus)
    
    # Return StreamingResponse with SSE headers
    return StreamingResponse(
        pipeline.execute_live(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable Nginx buffering if deployed
        }
    )

if __name__ == "__main__":
    # Standard entry point to spin up server
    uvicorn.run(
        "main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.DEBUG
    )
