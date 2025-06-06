"""Server API endpoints.

This server handles the API requests and responses to the motif studio frontend
or other clients that can interface with the API. The server is built using
FastAPI. Requests are handled by the endpoints defined in this file.

"""

import datetime

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .commons import provider_router
from .routers import host_providers, queries, uploads

__version__ = "0.1.0"


app = FastAPI()
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
