import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Callable, Any, Dict, Optional

logger = logging.getLogger("larvalens.worker_queue")

class IWorkerQueue(ABC):
    """
    Abstract interface for asynchronous scan processing.
    Allows single-process bounded in-memory worker for hackathon/development
    to be swapped with durable multi-server worker (e.g. Celery / Redis Streams / Supabase pgmq).
    
    NOTE: FastAPI BackgroundTasks alone is not a durable multi-server queue.
    """
    @abstractmethod
    async def enqueue(self, scan_id: str, file_path: str) -> None:
        pass

    @abstractmethod
    async def start(self) -> None:
        pass

    @abstractmethod
    async def stop(self) -> None:
        pass

class InProcessWorkerQueue(IWorkerQueue):
    def __init__(self, maxsize: int = 100, process_func: Optional[Callable[[str, str], Any]] = None):
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
        self.process_func = process_func
        self._worker_task: Optional[asyncio.Task] = None
        self._running = False

    def set_process_func(self, process_func: Callable[[str, str], Any]):
        self.process_func = process_func

    async def enqueue(self, scan_id: str, file_path: str) -> None:
        try:
            self.queue.put_nowait((scan_id, file_path))
            logger.info(f"Scan {scan_id} enqueued in worker queue (queue size: {self.queue.qsize()})")
        except asyncio.QueueFull:
            logger.error(f"Worker queue full! Dropping scan {scan_id}")
            raise RuntimeError("Analysis processing queue is full. Please retry shortly.")

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._worker_task = asyncio.create_task(self._worker_loop())
        logger.info("In-process bounded worker queue started.")

    async def stop(self) -> None:
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("In-process worker queue stopped.")

    async def _worker_loop(self) -> None:
        while self._running:
            try:
                scan_id, file_path = await self.queue.get()
                if self.process_func:
                    loop = asyncio.get_running_loop()
                    # Execute heavy CPU/vision pipeline in executor to prevent event loop blocking
                    await loop.run_in_executor(None, self.process_func, scan_id, file_path)
                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Unexpected worker queue error: {e}", exc_info=True)

# Global singleton worker queue
worker_queue = InProcessWorkerQueue()
