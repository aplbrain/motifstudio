# Creating a new query

This document explains how to create a new query type.

-   First, create the Request and Response classes for your query in `models.py`.

https://github.com/aplbrain/motifstudio-server/blob/dbabb5516133d26736a181daa78b61a0576be199/src/models.py#L108-L147

```python
class DownloadGraphQueryRequest(_QueryRequestBase):
    """
    A request to download a graph from a host provider.

    """

    format: _GraphFormats = Field(
        None,
        description=(
            "The format to download the graph in. If not specified, "
            "the default format for the host provider will be used."
        ),
        optional=True,
    )


class DownloadGraphQueryResponse(_QueryResponseBase):
    """
    A response to a request to download a graph from a host provider.

    """

    format: _GraphFormats = Field(
        None,
        description=(
            "The format to download the graph in. If not specified, "
            "the default format for the host provider will be used."
        ),
        optional=True,
    )
    graph: bytes = Field(
        ...,
        description="The graph, encoded in the specified format.",
    )
    error: str | None = Field(
        None,
        description="If an error occurred, a message describing the error.",
        optional=True,
    )

```

-   Add the necessary imports to `queries.py`:

https://github.com/aplbrain/motifstudio-server/blob/dbabb5516133d26736a181daa78b61a0576be199/src/server/routers/queries.py#L25-L26

-   Implement your query in `queries.py` (or the appropriate subrouter)

https://github.com/aplbrain/motifstudio-server/blob/dbabb5516133d26736a181daa78b61a0576be199/src/server/routers/queries.py#L54-L108

```python
@router.post("/graph/download")
def query_graph_download(
    graph_download_query_request: DownloadGraphQueryRequest,
    # Accept-Type: application/json will return a JSON response; otherwise, it
    # will return a binary response.
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
    accept: str = Header(None),
) -> DownloadGraphQueryResponse:
    """
    Get the root endpoint for the queries API.

    Right now this is just a placeholder that gives a list of the available
    queries under this endpoint prefix.

    """
    uri = commons.get_uri_from_id(graph_download_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {graph_download_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {graph_download_query_request.host_id}",
        )
    print(accept)

    tic = time.time()
    nx_graph, error_msg = provider.maybe_get_networkx_graph(uri)

    def _get_bytes(graph, fmt: _GraphFormats):
        # Create a temp file:
        with tempfile.NamedTemporaryFile(suffix=f".{fmt}") as tmp:
            nx.write_graphml(graph, tmp.name)
            with open(tmp.name, "rb") as f:
                return f.read()

    if nx_graph is not None and accept != "application/json":
        # Return the file as a binary response:
        return Response(
            content=_get_bytes(nx_graph, graph_download_query_request.format),
            media_type=f"application/{graph_download_query_request.format}",
        )  # type: ignore

    return DownloadGraphQueryResponse(
        host_id=graph_download_query_request.host_id,
        format=graph_download_query_request.format,
        graph=_get_bytes(nx_graph, graph_download_query_request.format) if nx_graph is not None else b"",
        error=error_msg,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )
```
