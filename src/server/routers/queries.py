"""
Routes that have to do with the actual graph queries.

"""

import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from ...models import (
    VertexCountQueryRequest,
    VertexCountQueryResponse,
    EdgeCountQueryRequest,
    EdgeCountQueryResponse,
    MotifCountQueryRequest,
    MotifCountQueryResponse,
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
    )


@router.post("/edges/count")
def query_count_edges(
    edge_count_query_request: EdgeCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> EdgeCountQueryResponse:
    """
    Get a count of the edges for a given host.

    """
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
    )


@router.post("/motifs/count")
def query_count_motifs(
    motif_count_query_request: MotifCountQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifCountQueryResponse:
    """
    Get a count of the motifs for a given host.

    """
    uri = commons.get_uri_from_name(motif_count_query_request.host_name)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with name {motif_count_query_request.host_name}")

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for URI {uri}")

    count = provider.get_motif_count(uri)
    return MotifCountQueryResponse(
        query=motif_count_query_request.query,
        motif_count=count,
        host_name=motif_count_query_request.host_name,
        response_time=datetime.datetime.now().isoformat(),
    )
