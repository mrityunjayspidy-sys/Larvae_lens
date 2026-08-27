import uuid
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .errors import AppError

logger = logging.getLogger("larvalens.api")

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        start_time = time.perf_counter()
        
        try:
            response: Response = await call_next(request)
            process_time = time.perf_counter() - start_time
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.4f}s"
            return response
        except AppError as exc:
            process_time = time.perf_counter() - start_time
            logger.warning(f"[{request_id}] AppError: {exc.code} - {exc.message}")
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "code": exc.code,
                    "message": exc.message,
                    "retryable": exc.retryable,
                    "request_id": request_id
                },
                headers={"X-Request-ID": request_id, "X-Process-Time": f"{process_time:.4f}s"}
            )
        except Exception as exc:
            process_time = time.perf_counter() - start_time
            logger.error(f"[{request_id}] Unhandled error: {str(exc)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred. Please contact system support.",
                    "retryable": True,
                    "request_id": request_id
                },
                headers={"X-Request-ID": request_id, "X-Process-Time": f"{process_time:.4f}s"}
            )
