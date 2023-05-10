from pydantic import BaseModel, Field


class HostProviderPublicListing(BaseModel):
    provider_type: str = Field(..., description="The type of the host provider (i.e., the name of the provider class.)")


class HostListing(BaseModel):
    uri: str
    name: str


class VertexCountQueryRequest(BaseModel):
    host_name: str = Field(..., description="The name of the host graph to query")


class VertexCountQueryResponse(BaseModel):
    vertex_count: int
    host_name: str
    response_time: str
    response_duration_sec: float


class EdgeCountQueryRequest(BaseModel):
    host_name: str = Field(..., description="The name of the host graph to query")


class EdgeCountQueryResponse(BaseModel):
    edge_count: int
    host_name: str
    response_time: str
    response_duration_ms: float


class MotifCountQueryRequest(BaseModel):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")
    host_name: str = Field(..., description="The name of the host graph to query")


class MotifCountQueryResponse(BaseModel):
    query: str
    host_name: str
    motif_count: int
    response_time: str
    response_duration_ms: float


# Type alias:
_MotifVertexID = str
_HostVertexID = str
_MotifResultsNonAggregated = list[dict[_MotifVertexID, _HostVertexID]]
_MotifResultsAggregatedHostVertex = dict[_HostVertexID, dict[_MotifVertexID, int]]
_MotifResultsAggregatedMotifVertexAttribute = dict[_MotifVertexID, dict[str, int]]


class MotifAggregationType:
    HostVertex = "host.vertex"
    MotifVertexAttribute = "motif.vertex"

    @classmethod
    def explain_valid(cls) -> list[str]:
        return [v for k, v in cls.__dict__.items() if not k.startswith("_") and isinstance(v, str)]


class MotifQueryRequest(BaseModel):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")
    host_name: str = Field(..., description="The name of the host graph to query")
    # Aggregator (`aggregator`) is an optional parameter that can be used to
    # specify the type of aggregation to use when returning results. If this
    # parameter is not specified, then no aggregation is performed and the
    # results are returned as-is. If this parameter is specified, then the
    # results are aggregated according to the specified type. The following
    # aggregation types are supported:
    #
    # - `host.vertex`: Returns a mapping of each host vertex and how many times
    #   it was matched to each motif vertex:
    #
    #   ```
    #   {
    #     "H1": { "M1": 1, "M2": 2, "M3": 1 },
    #     "H2": { "M1": 1, "M2": 1, "M3": 1 },
    #     ...
    #   }
    #   ```
    #
    # - `motif.vertex(attribute)`: Returns a mapping of each motif vertex and
    #   how many times it was matched to a host vertex of the specified
    #   attribute:
    #
    #   ```
    #   {
    #     "M1": { "Host_Type1": 2, "Host_Type2": 1 },
    #     "M2": { "Host_Type1": 2, "Host_Type7": 1, "Host_Type8": 1 },
    #     ...
    #   }
    #   ```
    aggregation_type: str | None = Field(
        None, description="The type of aggregation to perform on the results", optional=True
    )


class MotifQueryResponse(BaseModel):
    query: str
    host_name: str
    motif_count: int
    aggregation_type: str | None
    motif_results: _MotifResultsNonAggregated | _MotifResultsAggregatedHostVertex | _MotifResultsAggregatedMotifVertexAttribute
    response_time: str
    response_duration_ms: float
