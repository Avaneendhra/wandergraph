from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router
from app.utils.logging import logger

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Intelligent Knowledge-Graph-Powered Place Discovery & Recommendation Engine",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration - supports local dev, custom domains, Netlify, Render, and Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*(\.vercel\.app|\.netlify\.app|\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.app_name} on {settings.host}:{settings.port}")
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
