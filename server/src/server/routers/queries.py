"""Routes that have to do with the actual graph queries."""

import datetime
import tempfile
import time
from typing import Annotated

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException, Header, Response
from dotmotif import Motif
from ...models import (
    EdgeCountQueryRequest,
    EdgeCountQueryResponse,
    MotifCountQueryRequest,
    MotifCountQueryResponse,
    MotifQueryRequest,
    MotifQueryResponse,
    VertexCountQueryRequest,
    VertexCountQueryResponse,
    VertexAttributeQueryRequest,
    VertexAttributeQueryResponse,
    DownloadGraphQueryRequest,
    DownloadGraphQueryResponse,
    _GraphFormats,
)
from ..commons import HostProviderRouterGlobalDep, provider_router

router = APIRouter(
    prefix="/queries",
    tags=["queries"],
    dependencies=[
        Depends(provider_router),
    ],
)


@router.get("/")
def query_index(commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)]) -> dict[str, list[str]]:
    """Get the root endpoint for the queries API.

    Right now this is just a placeholder that gives a list of the available
    queries under this endpoint prefix.

    """
    return {
        "queries": ["vertices", "edges", "motifs"],
    }


@router.post("/graph/download")
def query_graph_download(
    graph_download_query_request: DownloadGraphQueryRequest,
    # Accept-Type: application/json will return a JSON response; otherwise, it
    # will return a binary response.
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
    accept: str = Header(None),
) -> DownloadGraphQueryResponse:
    """Get the root endpoint for the queries API.

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

    tic = time.time()
    nx_graph, error_msg = provider.maybe_get_networkx_graph(uri)

    def _get_bytes(graph, fmt: _GraphFormats):
        # We never prettyprint because we have to send it over the wire next
        # and there's no point in increasing the transfer size.
        # Create a temp file:
        with tempfile.NamedTemporaryFile(suffix=f".{fmt}") as tmp:
            if fmt in ["graphml", "graphml.gz"]:
                nx.write_graphml(graph, tmp.name, prettyprint=False)
                with open(tmp.name, "rb") as f:
                    return f.read()
            elif fmt in ["gexf", "gexf.gz"]:
                nx.write_gexf(graph, tmp.name, prettyprint=False)
                with open(tmp.name, "rb") as f:
                    return f.read()
            else:
                raise ValueError(f"Unknown graph format {fmt}")

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


@router.post("/vertices/count")
def query_count_vertices(
    vertex_count_query_request: VertexCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> VertexCountQueryResponse:
    """Get the vertex count for a given host."""
    tic = time.time()
    uri = commons.get_uri_from_id(vertex_count_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {vertex_count_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {vertex_count_query_request.host_id}",
        )

    count = provider.get_vertex_count(uri)
    return VertexCountQueryResponse(
        vertex_count=count,
        host_id=vertex_count_query_request.host_id,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/vertices/attributes")
def query_vertex_attributes(
    vertex_attribute_query_request: VertexAttributeQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> VertexAttributeQueryResponse:
    """Get the vertex attributes for a given host."""
    tic = time.time()
    uri = commons.get_uri_from_id(vertex_attribute_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {vertex_attribute_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {vertex_attribute_query_request.host_id}",
        )

    attributes = provider.get_vertex_attribute_schema(uri)
    return VertexAttributeQueryResponse(
        attributes=attributes,
        host_id=vertex_attribute_query_request.host_id,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/edges/count")
def query_count_edges(
    edge_count_query_request: EdgeCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> EdgeCountQueryResponse:
    """Get a count of the edges for a given host."""
    tic = time.time()
    uri = commons.get_uri_from_id(edge_count_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {edge_count_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {edge_count_query_request.host_id}",
        )

    count = provider.get_edge_count(uri)
    return EdgeCountQueryResponse(
        edge_count=count,
        host_id=edge_count_query_request.host_id,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/motifs/count")
def query_count_motifs(
    motif_count_query_request: MotifCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifCountQueryResponse:
    """Get a count of the motifs for a given host.

    This is the same as sending a motif query with the `count` aggregator.

    """
    tic = time.time()
    uri = commons.get_uri_from_id(motif_count_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {motif_count_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {motif_count_query_request.host_id}",
        )

    try:
        count = provider.get_motif_count(uri, motif_count_query_request.query)
        motif = Motif(motif_count_query_request.query)
        return MotifCountQueryResponse(
            query=motif_count_query_request.query,
            motif_count=count,
            motif_entities=[str(v) for v in motif.to_nx().nodes()],
            host_id=motif_count_query_request.host_id,
            response_time=datetime.datetime.now().isoformat(),
            response_duration_ms=(time.time() - tic) * 1000,
            error=None,
        )
    except Exception as e:
        return MotifCountQueryResponse(
            query=motif_count_query_request.query,
            motif_count=-1,
            motif_entities=[],
            host_id=motif_count_query_request.host_id,
            response_time=datetime.datetime.now().isoformat(),
            response_duration_ms=(time.time() - tic) * 1000,
            error=str(e),
        )


@router.post("/motifs")
def query_motifs(
    motif_query_request: MotifQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifQueryResponse:
    """Get a list of the motifs for a given host.

    Can optionally process results through an aggregator.
    Aggregator functions are defined in `motif_results_aggregators.py`.

    """
    tic = time.time()
    uri = commons.get_uri_from_id(motif_query_request.host_id)
    listing = commons.get_host_listing_from_id(motif_query_request.host_id)
    volumetric_data = None
    try:
        volumetric_data = listing.volumetric_data
    except Exception as e:
        print(f"Failed to get volumetric data: {e}")
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {motif_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {motif_query_request.host_id}",
        )

    try:
        motif = Motif(motif_query_request.query)
        results = provider.get_motifs(
            uri,
            motif_query_request.query,
            aggregation_type=motif_query_request.aggregation_type,
        )
        count = len(results)
        return MotifQueryResponse(
            query=motif_query_request.query,
            motif_count=count,
            motif_results=results,
            motif_entities=[str(v) for v in motif.to_nx().nodes()],
            aggregation_type=motif_query_request.aggregation_type,
            host_id=motif_query_request.host_id,
            host_volumetric_data=volumetric_data,
            response_time=datetime.datetime.now().isoformat(),
            response_duration_ms=(time.time() - tic) * 1000,
            error=None,
        )
    except Exception as e:
        return MotifQueryResponse(
            query=motif_query_request.query,
            motif_count=-1,
            motif_results=[],
            motif_entities=[],
            aggregation_type=motif_query_request.aggregation_type,
            host_id=motif_query_request.host_id,
            host_volumetric_data=volumetric_data,
            response_time=datetime.datetime.now().isoformat(),
            response_duration_ms=(time.time() - tic) * 1000,
            error=str(e),
        )


__all__ = ["router"]
