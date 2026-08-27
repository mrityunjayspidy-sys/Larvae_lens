import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.errors import AppError
from .core.middleware import RequestContextMiddleware
from .inference.model_registry import model_registry
from .services.worker_queue import worker_queue
from .services.scan_service import ScanService
from .api.v1.router import api_v1_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("larvalens")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LarvaLens API server lifespan...")
    # 1. Load model registry and verify cryptographic hashes
    model_registry.load_registry()
    logger.info(f"Model Registry status: {model_registry.status_code} (Ready: {model_registry.ready})")
    
    # 2. Initialize and start bounded in-process worker queue
    worker_queue.set_process_func(ScanService.execute_inference_worker)
    await worker_queue.start()
    
    yield
    
    # 3. Gracefully stop worker queue and clean up resources
    await worker_queue.stop()
    logger.info("Shutting down LarvaLens API server.")

app = FastAPI(
    title="LarvaLens API",
    description="Video-based probable mosquito-larva screening with debris rejection and geotagged evidence.",
    version="1.0.0",
    lifespan=lifespan
)

# Exception handlers for structured errors
@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    request_id = getattr(request.state, "request_id", "req-unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "retryable": exc.retryable,
            "request_id": request_id
        },
        headers={"X-Request-ID": request_id}
    )

@app.exception_handler(HTTPException)
async def handle_http_error(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "req-unknown")
    code = "HTTP_ERROR"
    if exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 503:
        code = "SERVICE_UNAVAILABLE"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": code,
            "message": str(exc.detail),
            "retryable": exc.status_code in [502, 503, 504],
            "request_id": request_id
        },
        headers={"X-Request-ID": request_id}
    )

# CORS Middleware
origins = [
    settings.APP_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"]
)

# Request context and error handling
app.add_middleware(RequestContextMiddleware)

# Mount API routes
app.include_router(api_v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
