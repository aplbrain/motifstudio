from pydantic import BaseModel


class MotifSearchQueryRequest(BaseModel):
    query: str
    host_id: str
