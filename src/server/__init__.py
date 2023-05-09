"""
This server handles the API requests and responses to the motif studio frontend
or other clients that can interface with the API. The server is built using
FastAPI. Requests are handled by the endpoints defined in this file.

"""

import datetime

from fastapi import Depends, FastAPI

from .routers import host_providers
from .commons import HostProviderRouterGlobalDep

__version__ = "0.1.0"


class Status:
    """
    Status codes for the API responses.

    """

    OK = "ok"
    ERROR = "error"


app = FastAPI()
app.include_router(host_providers.router, dependencies=[Depends(HostProviderRouterGlobalDep)])


def _response_with_status(data: dict | None = None, status: str = Status.OK) -> dict:
    """
    Return a response with a status code and a data payload.

    Arguments:
        data (dict): The data payload to return. If none is provided, an empty
            dictionary is returned.
        status (str): The status code to return. Defaults to Status.OK.

    Returns:
        dict: The response dictionary.

    """
    return {"status": status, "server_time": datetime.datetime.now().isoformat(), "data": data or {}}


@app.get("/")
def read_root():
    """
    Get the API root endpoint.

    Returns a response with the server version and other vitals.

    Arguments:
        None

    Returns:
        dict: The response dictionary.

    """
    return _response_with_status({"server_version": __version__})


__all__ = ["app"]
