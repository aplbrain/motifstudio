"""
This server handles the API requests and responses to the motif studio frontend
or other clients that can interface with the API. The server is built using
FastAPI. Requests are handled by the endpoints defined in this file.

"""

import datetime
from typing import Optional
from fastapi import FastAPI

from .models import MotifSearchQueryRequest

__version__ = "0.1.0"


class Status:
    """
    Status codes for the API responses.

    """

    OK = "ok"
    ERROR = "error"


app = FastAPI()


def _response_with_status(data: Optional[dict] = None, status: str = Status.OK) -> dict:
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


@app.post("/search/motifs")
def read_item(request: MotifSearchQueryRequest):
    return _response_with_status({"query": request.query, "host_id": request.host_id})


__all__ = ["app"]
