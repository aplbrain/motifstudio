from pydantic import BaseModel


class MotifSearchQueryRequest(BaseModel):
    query: str
    host_id: str


class HostProviderPublicListing(BaseModel):
    provider_type: str


class HostListing(BaseModel):
    uri: str
    name: str


class VertexCountQueryRequest(BaseModel):
    host_name: str


class VertexCountQueryResponse(BaseModel):
    vertex_count: int
    host_name: str
    response_time: str


class EdgeCountQueryRequest(BaseModel):
    host_name: str


class EdgeCountQueryResponse(BaseModel):
    edge_count: int
    host_name: str
    response_time: str


class MotifCountQueryRequest(BaseModel):
    query: str
    host_name: str


class MotifCountQueryResponse(BaseModel):
    query: str
    host_name: str
    motif_count: int
    response_time: str
