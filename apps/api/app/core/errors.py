from fastapi import HTTPException
from typing import Optional

class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        retryable: bool = False,
        headers: Optional[dict] = None
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.retryable = retryable

class ModelNotReadyError(AppError):
    def __init__(self, message: str = "Analysis service is not ready. Required models or manifests are missing/unverified."):
        super().__init__(status_code=503, code="MODEL_NOT_READY", message=message, retryable=True)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required or token expired."):
        super().__init__(status_code=401, code="UNAUTHORIZED", message=message, retryable=False)

class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(status_code=403, code="FORBIDDEN", message=message, retryable=False)

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found."):
        super().__init__(status_code=404, code="NOT_FOUND", message=message, retryable=False)

class ValidationError(AppError):
    def __init__(self, message: str, code: str = "VALIDATION_FAILED"):
        super().__init__(status_code=422, code=code, message=message, retryable=False)

class FileTooLargeError(AppError):
    def __init__(self, max_mb: int):
        super().__init__(
            status_code=413,
            code="FILE_TOO_LARGE",
            message=f"Video exceeds maximum allowed size of {max_mb} MB.",
            retryable=False
        )

class UnsupportedMediaTypeError(AppError):
    def __init__(self, message: str = "Unsupported video format. Allowed formats: MP4, WebM, MOV."):
        super().__init__(status_code=415, code="UNSUPPORTED_MEDIA_TYPE", message=message, retryable=False)
