"""Models for the motif studio database and API."""

from typing import Any, Literal
from pydantic import BaseModel, Field


# Type alias:
_MotifVertexID = str
_HostVertexID = str | Any
_MotifResultsNonAggregated = list[dict[_MotifVertexID, _HostVertexID]]
_MotifResultsAggregatedHostVertex = dict[_HostVertexID, dict[_MotifVertexID, int]]
_MotifResultsAggregatedMotifVertex = dict[_MotifVertexID, dict[_HostVertexID, int]]
_MotifResultsAggregatedMotifVertexAttribute = dict[_MotifVertexID, dict[str, int]]
_AttributeType = Literal["str", "int", "float", "bool", "datetime.datetime"] | None
_GraphFormats = Literal["graphml", "graphml.gz", "gexf", "gexf.gz"] | None
_QueryType = Literal["dotmotif", "cypher"]
AttributeSchema = dict[str, _AttributeType]
HostProviderID = str

PossibleMotifResultTypes = (
    _MotifResultsNonAggregated
    | _MotifResultsAggregatedHostVertex
    | _MotifResultsAggregatedMotifVertexAttribute
    | _MotifResultsAggregatedMotifVertex
)


class _QueryRequestBase(BaseModel):
    host_id: str = Field(..., description="The ID of the host graph to query")


class _QueryResponseBase(BaseModel):
    response_time: str
    response_duration_ms: float
    host_id: str


class HostProviderPublicListing(BaseModel):
    """A public listing of a host provider, containing its type/class."""

    provider_type: str = Field(
        ...,
        description="The type of the host provider (i.e., name of the provider class.)",
    )
    id: str = Field(
        ...,
        description="The ID of the host provider, as specified in the server's configuration file.",
    )


class HostListing(BaseModel):
    """A public listing of a host graph, containing its ID and provider."""

    id: str
    uri: str
    name: str
    provider: dict[str, str]
    volumetric_data: dict[str, Any] = Field(
        description="A dictionary of volumetric data for the host graph.",
        default_factory=dict,
    )


class VertexCountQueryRequest(_QueryRequestBase):
    """A request to count the number of vertices in a host graph."""

    ...


class VertexCountQueryResponse(_QueryResponseBase):
    """A response with the vertex count results for a host graph."""

    vertex_count: int


class VertexAttributeQueryRequest(_QueryRequestBase):
    """A request to get the vertex attributes for a host graph."""

    ...


class VertexAttributeQueryResponse(_QueryResponseBase):
    """A response with the vertex attribute results for a host graph."""

    # Attribute name to attribute schema:
    attributes: AttributeSchema


class EdgeCountQueryRequest(_QueryRequestBase):
    """A request to count the number of edges in a host graph."""

    ...


class EdgeCountQueryResponse(_QueryResponseBase):
    """A response with the edge count results for a host graph."""

    edge_count: int


class MotifParseQueryRequest(_QueryRequestBase):
    """A request to parse a motif query."""

    query: str = Field(
        ...,
        description="The query to execute",
    )
    query_type: _QueryType = Field(
        "dotmotif",
        description="The type of query language being used",
    )


class MotifParseQueryResponse(_QueryResponseBase):
    """A response with the motif parse results for a host graph."""

    query: str
    query_type: _QueryType
    motif_entities: list[str]
    motif_edges: list[list[str]]
    motif_nodelink_json: str
    error: str | None = Field(
        None,
        description="If an error occurred, a message describing the error.",
    )


class MotifCountQueryRequest(_QueryRequestBase):
    """A request to count the number of motifs in a host graph."""

    query: str = Field(
        ...,
        description="The query to execute",
    )
    query_type: _QueryType = Field(
        "dotmotif",
        description="The type of query language being used",
    )


class MotifCountQueryResponse(_QueryResponseBase):
    """A response with the motif count results for a host graph."""

    query: str
    query_type: _QueryType
    motif_count: int
    motif_entities: list[str]
    error: str | None = Field(
        None,
        description="If an error occurred, a message describing the error.",
    )


class MotifQueryRequest(BaseModel):
    """A request to query a host graph for motifs."""

    query: str = Field(
        ...,
        description="The query to execute",
    )
    query_type: _QueryType = Field(
        "dotmotif",
        description="The type of query language being used",
    )
    host_id: str = Field(..., description="The ID of the host graph to query")
    # Aggregator (`aggregator`) is an optional parameter that can be used to
    # specify the type of aggregation to use when returning results. If this
    # parameter is not specified, then no aggregation is performed and the
    # results are returned as-is. If this parameter is specified, then the
    # results are aggregated according to the specified type.
    aggregation_type: str | None = Field(
        None,
        description="The type of aggregation to perform on the results",
    )


class MotifQueryResponse(_QueryResponseBase):
    """A response with the motif query results for a host graph.

    Results are aggregated according to the `aggregator` parameter in the
    request, if specified.
    """

    query: str
    query_type: _QueryType
    motif_count: int
    aggregation_type: str | None
    motif_results: PossibleMotifResultTypes
    motif_entities: list[str]
    error: str | None = Field(
        None,
        description="If an error occurred, a message describing the error.",
    )
    host_volumetric_data: dict[str, Any] | None


class DownloadGraphQueryRequest(_QueryRequestBase):
    """A request to download a graph from a host provider."""

    format: _GraphFormats = Field(
        None,
        description=(
            "The format to download the graph in. If not specified, "
            "the default format for the host provider will be used."
        ),
    )


class DownloadGraphQueryResponse(_QueryResponseBase):
    """A response to a request to download a graph from a host provider."""

    format: _GraphFormats = Field(
        None,
        description=(
            "The format to download the graph in. If not specified, "
            "the default format for the host provider will be used."
        ),
    )
    graph: bytes = Field(
        ...,
        description="The graph, encoded in the specified format.",
    )
    error: str | None = Field(
        None,
        description="If an error occurred, a message describing the error.",
    )


class GraphUploadResponse(BaseModel):
    """A response to a graph upload request."""

    temp_id: str = Field(..., description="The temporary ID of the uploaded graph.")
    original_filename: str = Field(..., description="The original filename of the uploaded graph.")
    file_size: int = Field(..., description="The size of the uploaded file in bytes.")
    success: bool = Field(..., description="Whether the upload was successful.")
    error: str | None = Field(None, description="If an error occurred, a message describing the error.")


class TemporaryHostListing(BaseModel):
    """A listing for a temporarily uploaded host graph."""

    temp_id: str = Field(..., description="The temporary ID of the uploaded graph.")
    name: str = Field(..., description="The display name for the temporary graph.")
    original_filename: str = Field(..., description="The original filename of the uploaded graph.")
    file_size: int = Field(..., description="The size of the uploaded file in bytes.")
    created_at: str = Field(..., description="When the file was uploaded.")


class GraphUploadCleanupResponse(BaseModel):
    """A response to a graph upload cleanup request."""

    temp_id: str = Field(..., description="The temporary ID of the graph that was cleaned up.")
    success: bool = Field(..., description="Whether the cleanup was successful.")
    error: str | None = Field(None, description="If an error occurred, a message describing the error.")
