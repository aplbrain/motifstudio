"""Routes that have to do with the actual graph queries."""

import datetime
import json
import os
import tempfile
import time
import asyncio
import multiprocessing as mp
from typing import Annotated

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
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
    GraphPropertiesQueryRequest,
    GraphPropertiesQueryResponse,
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


def _run_graph_operation(commons: HostProviderRouterGlobalDep, func, *args):
    """Run a graph operation using the configured memory and time limits."""
    ram_limit = (
        commons.max_ram_bytes
        if commons.max_ram_bytes is not None
        else int(get_total_ram_bytes() * commons.max_ram_pct)
    )
    try:
        return run_with_limits(
            func,
            args=args,
            max_ram_bytes=ram_limit,
            timeout_seconds=commons.max_duration_seconds,
        )
    except TimeoutError as error:
        raise HTTPException(status_code=504, detail=str(error)) from error
    except MemoryError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def _serialize_graph(graph, fmt: _GraphFormats) -> str:
    """Serialize a graph to a temporary file and return its path."""
    with tempfile.NamedTemporaryFile(suffix=f".{fmt}", delete=False) as temporary_file:
        path = temporary_file.name
    try:
        if fmt in ["graphml", "graphml.gz"]:
            nx.write_graphml(graph, path, prettyprint=False)
        elif fmt in ["gexf", "gexf.gz"]:
            nx.write_gexf(graph, path, prettyprint=False)
        else:
            raise ValueError(f"Unknown graph format {fmt}")
        return path
    except Exception:
        os.unlink(path)
        raise


def _read_and_remove(path: str) -> bytes:
    """Read a temporary file and remove it."""
    try:
        with open(path, "rb") as serialized_graph:
            return serialized_graph.read()
    finally:
        os.unlink(path)


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

    nx_graph, error_msg = _run_graph_operation(commons, provider.maybe_get_networkx_graph, uri)

    if nx_graph is not None and accept != "application/json":
        path = _run_graph_operation(commons, _serialize_graph, nx_graph, graph_download_query_request.format)
        return FileResponse(
            path,
            media_type="application/octet-stream",
            filename=f"graph.{graph_download_query_request.format}",
            background=BackgroundTask(os.unlink, path),
        )

    return DownloadGraphQueryResponse(
        host_id=graph_download_query_request.host_id,
        format=graph_download_query_request.format,
        graph=(
            _read_and_remove(
                _run_graph_operation(commons, _serialize_graph, nx_graph, graph_download_query_request.format)
            )
            if nx_graph is not None
            else b""
        ),
        error=error_msg,
        response_time=datetime.datetime.now().isoformat(),
        response_duration_ms=(time.time() - tic) * 1000,
    )


@router.post("/graph/properties")
def query_graph_properties(
    request: GraphPropertiesQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
) -> GraphPropertiesQueryResponse:
    """Get graph counts and attribute schemas from one graph load."""
    tic = time.time()
    uri = commons.get_uri_from_id(request.host_id)
    if uri is None:
        raise HTTPException(status_code=404, detail=f"No host found with ID {request.host_id}")
    provider = commons.host_provider_router.provider_for(uri)
    if provider is None:
        raise HTTPException(status_code=404, detail=f"No provider found for host {request.host_id}")

    properties = _run_graph_operation(commons, provider.get_graph_properties, uri)
    return GraphPropertiesQueryResponse(
        **properties,
        host_id=request.host_id,
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

    count = _run_graph_operation(commons, provider.get_vertex_count, uri)
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

    attributes = _run_graph_operation(commons, provider.get_vertex_attribute_schema, uri)
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

    count = _run_graph_operation(commons, provider.get_edge_count, uri)
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

    attributes = _run_graph_operation(commons, provider.get_edge_attribute_schema, uri)
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
async def query_motifs(
    motif_query_request: MotifQueryRequest,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)],
    request: Request,
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

    cancel_event = mp.Event()

    async def watch_disconnect():
        while not cancel_event.is_set():
            if await request.is_disconnected():
                cancel_event.set()
                return
            await asyncio.sleep(0.1)

    watcher = asyncio.create_task(watch_disconnect())
    try:
        # Handle different query types
        if motif_query_request.query_type == "cypher":
            # For Cypher queries, we need to get the host graph first
            # Check if provider supports NetworkX graphs
            if isinstance(provider, NetworkXHostProvider):
                host_graph = await asyncio.to_thread(
                    run_with_limits,
                    provider.get_networkx_graph,
                    (uri,),
                    None,
                    ram_limit,
                    timeout,
                    cancel_event,
                )
                results = await asyncio.to_thread(
                    run_with_limits,
                    grandcypher.GrandCypher(host_graph).run,
                    (motif_query_request.query,),
                    None,
                    ram_limit,
                    timeout,
                    cancel_event,
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
                if motif_query_request.limit is not None:
                    formatted_results = formatted_results[:motif_query_request.limit]

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
            count, results = await asyncio.to_thread(
                run_with_limits,
                provider.get_motifs,
                (uri, motif_query_request.query),
                {
                    "aggregation_type": motif_query_request.aggregation_type,
                    "limit": motif_query_request.limit,
                },
                ram_limit,
                timeout,
                cancel_event,
            )
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
    except InterruptedError:
        raise HTTPException(status_code=499, detail="Query cancelled")
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
    finally:
        cancel_event.set()
        watcher.cancel()


__all__ = ["router"]
