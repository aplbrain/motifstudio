from typing import Annotated
from fastapi import APIRouter, Depends
from ...models import HostProviderPublicListing
from ..commons import HostProviderRouterGlobalDep, provider_router

router = APIRouter(prefix="/providers", tags=["providers"], dependencies=[Depends(provider_router)])


@router.get("/")
def list_host_providers(
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)]
) -> dict[str, list[HostProviderPublicListing]]:
    return {
        "host_providers": [
            HostProviderPublicListing(provider_type=provider.type) for provider in commons.all_providers()
        ]
    }


@router.get("/hostlist")
def list_hosts(commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)]) -> dict[str, list[str]]:
    return {"hosts": [host.name for host in commons.all_hosts]}
