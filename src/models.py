from pydantic import BaseModel, Field


class _QueryRequestBase(BaseModel):
    host_name: str = Field(..., description="The name of the host graph to query")


class _QueryResponseBase(BaseModel):
    response_time: str
    response_duration_ms: float
    host_name: str


class HostProviderPublicListing(BaseModel):
    provider_type: str = Field(..., description="The type of the host provider (i.e., the name of the provider class.)")


class HostListing(BaseModel):
    uri: str
    name: str


class VertexCountQueryRequest(_QueryRequestBase):
    ...


class VertexCountQueryResponse(_QueryResponseBase):
    vertex_count: int


class EdgeCountQueryRequest(_QueryRequestBase):
    ...


class EdgeCountQueryResponse(_QueryResponseBase):
    edge_count: int


class MotifCountQueryRequest(_QueryRequestBase):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")


class MotifCountQueryResponse(_QueryResponseBase):
    query: str
    motif_count: int


# Type alias:
_MotifVertexID = str
_HostVertexID = str
_MotifResultsNonAggregated = list[dict[_MotifVertexID, _HostVertexID]]
_MotifResultsAggregatedHostVertex = dict[_HostVertexID, dict[_MotifVertexID, int]]
_MotifResultsAggregatedMotifVertex = dict[_MotifVertexID, dict[_HostVertexID, int]]
_MotifResultsAggregatedMotifVertexAttribute = dict[_MotifVertexID, dict[str, int]]

PossibleMotifResultTypes = (
    _MotifResultsNonAggregated
    | _MotifResultsAggregatedHostVertex
    | _MotifResultsAggregatedMotifVertexAttribute
    | _MotifResultsAggregatedMotifVertex
)


class MotifQueryRequest(BaseModel):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")
    host_name: str = Field(..., description="The name of the host graph to query")
    # Aggregator (`aggregator`) is an optional parameter that can be used to
    # specify the type of aggregation to use when returning results. If this
    # parameter is not specified, then no aggregation is performed and the
    # results are returned as-is. If this parameter is specified, then the
    # results are aggregated according to the specified type.
    aggregation_type: str | None = Field(
        None, description="The type of aggregation to perform on the results", optional=True
    )


class MotifQueryResponse(_QueryResponseBase):
    query: str
    motif_count: int
    aggregation_type: str | None
    motif_results: PossibleMotifResultTypes
