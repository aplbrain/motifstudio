"""Server API endpoints.

This server handles the API requests and responses to the motif studio frontend
or other clients that can interface with the API. The server is built using
FastAPI. Requests are handled by the endpoints defined in this file.

"""

import datetime
import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .commons import provider_router
from .routers import host_providers, queries, uploads

__version__ = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    commons = provider_router()
    uploads.sync_temporary_hosts(commons)

    async def cleanup_expired_uploads():
        while True:
            await asyncio.sleep(60 * 60)
            uploads._temp_provider.cleanup_expired_files()
            uploads.sync_temporary_hosts(commons)

    cleanup_task = asyncio.create_task(cleanup_expired_uploads())
    try:
        yield
    finally:
        cleanup_task.cancel()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(host_providers.router, dependencies=[Depends(provider_router)])
app.include_router(queries.router, dependencies=[Depends(provider_router)])
app.include_router(uploads.router, dependencies=[Depends(provider_router)])


@app.get("/")
def read_root():
    """Get the API root endpoint.

    Returns a response with the server version and other vitals.

    Arguments:
        None

    Returns:
        dict: The response dictionary.

    """
    return {
        "server_time": datetime.datetime.now().isoformat(),
        "server_version": __version__,
    }


__all__ = ["app"]
