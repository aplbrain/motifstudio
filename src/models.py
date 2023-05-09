from pydantic import BaseModel


class MotifSearchQueryRequest(BaseModel):
    query: str
    host_id: str


class HostProviderPublicListing(BaseModel):
    provider_type: str
    provider_uri: str
