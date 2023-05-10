"""
Routes that have to do with the actual graph queries.

"""

import datetime
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from ...models import (
    EdgeCountQueryRequest,
    EdgeCountQueryResponse,
    MotifCountQueryRequest,
    MotifCountQueryResponse,
    MotifQueryRequest,
    MotifQueryResponse,
    VertexCountQueryRequest,
    VertexCountQueryResponse,
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
    """
    Get the root endpoint for the queries API.

    Right now this is just a placeholder that gives a list of the available
    queries under this endpoint prefix.

    """
    return {
        "queries": ["vertices", "edges", "motifs"],
    }


@router.post("/vertices/count")
def query_count_vertices(
    vertex_count_query_request: VertexCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> VertexCountQueryResponse:
    """
    Get the vertex count for a given host.

    """
    tic = time.time()
    uri = commons.get_uri_from_name(vertex_count_query_request.host_name)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with name {vertex_count_query_request.host_name}")

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for URI {uri}")

    count = provider.get_vertex_count(uri)
    return VertexCountQueryResponse(
        vertex_count=count,
        host_name=vertex_count_query_request.host_name,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/edges/count")
def query_count_edges(
    edge_count_query_request: EdgeCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> EdgeCountQueryResponse:
    """
    Get a count of the edges for a given host.

    """
    tic = time.time()
    uri = commons.get_uri_from_name(edge_count_query_request.host_name)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with name {edge_count_query_request.host_name}")

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for URI {uri}")

    count = provider.get_edge_count(uri)
    return EdgeCountQueryResponse(
        edge_count=count,
        host_name=edge_count_query_request.host_name,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/motifs/count")
def query_count_motifs(
    motif_count_query_request: MotifCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifCountQueryResponse:
    """
    Get a count of the motifs for a given host.

    This is the same as sending a motif query with the `count` aggregator.

    """
    tic = time.time()
    uri = commons.get_uri_from_name(motif_count_query_request.host_name)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with name {motif_count_query_request.host_name}")

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for URI {uri}")

    count = provider.get_motif_count(uri, motif_count_query_request.query)
    return MotifCountQueryResponse(
        query=motif_count_query_request.query,
        motif_count=count,
        host_name=motif_count_query_request.host_name,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/motifs")
def query_motifs(
    motif_query_request: MotifQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifQueryResponse:
    """
    Get a list of the motifs for a given host, and optionally process them
    through an aggregator.

    Aggregator functions are defined in `motif_results_aggregators.py`.

    """
    tic = time.time()
    uri = commons.get_uri_from_name(motif_query_request.host_name)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with name {motif_query_request.host_name}")

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for URI {uri}")

    try:
        results = provider.get_motifs(
            uri, motif_query_request.query, aggregation_type=motif_query_request.aggregation_type
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    count = len(results)
    return MotifQueryResponse(
        query=motif_query_request.query,
        motif_count=count,
        motif_results=results,
        aggregation_type=motif_query_request.aggregation_type,
        host_name=motif_query_request.host_name,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


__all__ = ["router"]
