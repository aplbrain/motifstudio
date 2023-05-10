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


class EdgeCountQueryRequest(BaseModel):
    host_name: str = Field(..., description="The name of the host graph to query")


class EdgeCountQueryResponse(BaseModel):
    edge_count: int
    host_name: str
    response_time: str


class MotifCountQueryRequest(BaseModel):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")
    host_name: str = Field(..., description="The name of the host graph to query")


class MotifCountQueryResponse(BaseModel):
    query: str
    host_name: str
    motif_count: int
    response_time: str


class MotifQueryRequest(BaseModel):
    query: str = Field(..., description="The motif query to execute, in the DotMotif query language")
    host_name: str = Field(..., description="The name of the host graph to query")


class MotifQueryResponse(BaseModel):
    query: str
    host_name: str
    motif_count: int
    motif_results: list[dict[str, str]]
    response_time: str
