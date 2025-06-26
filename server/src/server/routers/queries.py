"""Routes that have to do with the actual graph queries."""

import datetime
import json
import tempfile
import time
from typing import Annotated

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException, Header, Response
from dotmotif import Motif
import grandcypher
from ...models import (
    EdgeCountQueryRequest,
    EdgeCountQueryResponse,
    EdgeAttributeQueryRequest,
    EdgeAttributeQueryResponse,
    MotifCountQueryRequest,
    MotifCountQueryResponse,
    MotifParseQueryRequest,
    MotifParseQueryResponse,
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
from ...host_provider.host_provider.host_provider import NetworkXHostProvider
from ..commons import HostProviderRouterGlobalDep, provider_router, run_with_limits, get_total_ram_bytes

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
    # Enforce query resource limits
    ram_limit = commons.max_ram_bytes if commons.max_ram_bytes is not None else int(get_total_ram_bytes() * commons.max_ram_pct)
    try:
        nx_graph, error_msg = run_with_limits(
            provider.maybe_get_networkx_graph,
            args=(uri,),
            max_ram_bytes=ram_limit,
            timeout_seconds=commons.max_duration_seconds,
        )
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except MemoryError as e:
        raise HTTPException(status_code=503, detail=str(e))

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


@router.post("/edges/attributes")
def query_edge_attributes(
    edge_attribute_query_request: EdgeAttributeQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> EdgeAttributeQueryResponse:
    """Get the edge attributes for a given host."""
    tic = time.time()
    uri = commons.get_uri_from_id(edge_attribute_query_request.host_id)
    if uri is None:
        raise HTTPException(
            status_code=404,
            detail=f"No host found with ID {edge_attribute_query_request.host_id}",
        )

    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(
            status_code=404,
            detail=f"No provider found for host {edge_attribute_query_request.host_id}",
        )

    attributes = provider.get_edge_attribute_schema(uri)
    return EdgeAttributeQueryResponse(
        attributes=attributes,
        host_id=edge_attribute_query_request.host_id,
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
    # Compute resource limits for the query
    ram_limit = commons.max_ram_bytes if commons.max_ram_bytes is not None else int(get_total_ram_bytes() * commons.max_ram_pct)
    timeout = commons.max_duration_seconds
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
        # Handle different query types
        if motif_count_query_request.query_type == "cypher":
            # For Cypher count queries, we need to execute and count results
            # Check if provider supports NetworkX graphs
            if isinstance(provider, NetworkXHostProvider):
                host_graph = run_with_limits(
                    provider.get_networkx_graph,
                    args=(uri,),
                    max_ram_bytes=ram_limit,
                    timeout_seconds=timeout,
                )
                results = run_with_limits(
                    grandcypher.GrandCypher(host_graph).run,
                    args=(motif_count_query_request.query,),
                    max_ram_bytes=ram_limit,
                    timeout_seconds=timeout,
                )

                # Handle GrandCypher result format: {"entity": [res1, res2, res3], "entity2": [res1, res2, res3]}
                if isinstance(results, dict) and results:
                    # Get the length of the first entity's results to determine count
                    first_key = next(iter(results.keys()))
                    count = len(results[first_key]) if first_key in results else 0
                    motif_entities = list(results.keys())
                else:
                    count = 0
                    motif_entities = []

                return MotifCountQueryResponse(
                    query=motif_count_query_request.query,
                    query_type=motif_count_query_request.query_type,
                    motif_count=count,
                    motif_entities=motif_entities,
                    host_id=motif_count_query_request.host_id,
                    response_time=datetime.datetime.now().isoformat(),
                    response_duration_ms=(time.time() - tic) * 1000,
                    error=None,
                )
            else:
                # Provider doesn't support NetworkX graphs for Cypher queries
                raise ValueError(f"Provider {provider.type} does not support Cypher queries")
        else:
            # Default to DotMotif counting
            count = run_with_limits(
                provider.get_motif_count,
                args=(uri, motif_count_query_request.query),
                max_ram_bytes=ram_limit,
                timeout_seconds=timeout,
            )
            motif = Motif(motif_count_query_request.query)
            return MotifCountQueryResponse(
                query=motif_count_query_request.query,
                query_type=motif_count_query_request.query_type,
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
            query_type=motif_count_query_request.query_type,
            motif_count=-1,
            motif_entities=[],
            host_id=motif_count_query_request.host_id,
            response_time=datetime.datetime.now().isoformat(),
            response_duration_ms=(time.time() - tic) * 1000,
            error=str(e),
        )


@router.post("/motifs/_parse")
def query_parse_motif(
    motif_count_query_request: MotifParseQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> MotifParseQueryResponse:
    """Parse a motif and return the compiled query graph."""
    tic = time.time()

    try:
        # Handle different query types
        if motif_count_query_request.query_type == "cypher":
            # For Cypher queries, we can't create a traditional motif visualization
            # since Cypher is more general. Return basic structure
            return MotifParseQueryResponse(
                query=motif_count_query_request.query,
                query_type=motif_count_query_request.query_type,
                motif_entities=[],
                motif_edges=[],
                motif_nodelink_json="{}",
                host_id=motif_count_query_request.host_id,
                response_time=datetime.datetime.now().isoformat(),
                response_duration_ms=(time.time() - tic) * 1000,
                error=None,
            )
        else:
            # Default to DotMotif parsing
            motif = Motif(motif_count_query_request.query)
            gnx = motif.to_nx()
            for node, constraints_dict in motif.list_node_constraints().items():
                for constraint, value in constraints_dict.items():
                    gnx.nodes[node][constraint] = value
            for node, constraints_dict in motif.list_dynamic_node_constraints().items():
                for constraint, value in constraints_dict.items():
                    gnx.nodes[node]["d" + constraint] = value
            return MotifParseQueryResponse(
                query=motif_count_query_request.query,
                query_type=motif_count_query_request.query_type,
                motif_entities=[str(v) for v in motif.to_nx().nodes()],
                motif_edges=[[str(u), str(v)] for u, v in motif.to_nx().edges()],
                motif_nodelink_json=json.dumps(nx.readwrite.node_link_data(gnx)),
                host_id=motif_count_query_request.host_id,
                response_time=datetime.datetime.now().isoformat(),
                response_duration_ms=(time.time() - tic) * 1000,
                error=None,
            )
    except Exception as e:
        return MotifParseQueryResponse(
            query=motif_count_query_request.query,
            query_type=motif_count_query_request.query_type,
            motif_entities=[],
            motif_edges=[],
            motif_nodelink_json="",
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
    # Compute resource limits for the query
    ram_limit = commons.max_ram_bytes if commons.max_ram_bytes is not None else int(get_total_ram_bytes() * commons.max_ram_pct)
    timeout = commons.max_duration_seconds
    uri = commons.get_uri_from_id(motif_query_request.host_id)
    listing = commons.get_host_listing_from_id(motif_query_request.host_id)
    volumetric_data = None
    try:
        if listing is not None:
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
        # Handle different query types
        if motif_query_request.query_type == "cypher":
            # For Cypher queries, we need to get the host graph first
            # Check if provider supports NetworkX graphs
            if isinstance(provider, NetworkXHostProvider):
                host_graph = run_with_limits(
                    provider.get_networkx_graph,
                    args=(uri,),
                    max_ram_bytes=ram_limit,
                    timeout_seconds=timeout,
                )
                results = run_with_limits(
                    grandcypher.GrandCypher(host_graph).run,
                    args=(motif_query_request.query,),
                    max_ram_bytes=ram_limit,
                    timeout_seconds=timeout,
                )

                # Convert GrandCypher results to expected format
                # GrandCypher returns: {"entity": [res1, res2, res3], "entity2": [res1, res2, res3]}
                # We need to convert to: [{"entity": res1, "entity2": res1}, {"entity": res2, "entity2": res2}, ...]
                # res can be any type, so we use JSON serialization for the 'id' field
                formatted_results = []
                motif_entities = []

                if isinstance(results, dict) and results:
                    motif_entities = list(results.keys())
                    # Get the length of results (assuming all entities have same number of results)
                    if motif_entities:
                        first_key = motif_entities[0]
                        result_count = len(results[first_key]) if first_key in results else 0

                        # Transform the results into the expected format
                        for i in range(result_count):
                            result_row = {}
                            for entity in motif_entities:
                                if entity in results and i < len(results[entity]):
                                    # JSON serialize the result to handle any data type
                                    result_row[entity] = {
                                        "id": json.dumps(results[entity][i])
                                        if results[entity][i] is not None
                                        else "null"
                                    }
                            formatted_results.append(result_row)

                count = len(formatted_results)

                return MotifQueryResponse(
                    query=motif_query_request.query,
                    query_type=motif_query_request.query_type,
                    motif_count=count,
                    motif_results=formatted_results,
                    motif_entities=motif_entities,
                    aggregation_type=motif_query_request.aggregation_type,
                    host_id=motif_query_request.host_id,
                    host_volumetric_data=volumetric_data,
                    response_time=datetime.datetime.now().isoformat(),
                    response_duration_ms=(time.time() - tic) * 1000,
                    error=None,
                )
            else:
                # Provider doesn't support NetworkX graphs for Cypher queries
                raise ValueError(f"Provider {provider.type} does not support Cypher queries")
        else:
            # Default to DotMotif for backward compatibility
            motif = Motif(motif_query_request.query)
            results = run_with_limits(
                provider.get_motifs,
                args=(uri, motif_query_request.query),
                kwargs={"aggregation_type": motif_query_request.aggregation_type},
                max_ram_bytes=ram_limit,
                timeout_seconds=timeout,
            )
            count = len(results)
            return MotifQueryResponse(
                query=motif_query_request.query,
                query_type=motif_query_request.query_type,
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
            query_type=motif_query_request.query_type,
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
