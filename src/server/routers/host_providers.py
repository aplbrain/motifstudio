from typing import Annotated
from fastapi import APIRouter, Depends
from ...models import HostProviderPublicListing
from ..commons import HostProviderRouterGlobalDep

router = APIRouter(prefix="/providers", tags=["providers"], dependencies=[Depends(HostProviderRouterGlobalDep)])


@router.get("/")
def list_host_providers(
    commons: Annotated[HostProviderRouterGlobalDep, Depends(HostProviderRouterGlobalDep)]
) -> dict[str, list[HostProviderPublicListing]]:
    return {
        "host_providers": [HostProviderPublicListing(provider_type="None", provider_uri="None")],
    }


@router.get("/hostlist")
def list_hosts(
    commons: Annotated[HostProviderRouterGlobalDep, Depends(HostProviderRouterGlobalDep)]
) -> dict[str, list[str]]:
    return {
        "host_providers": commons.all_hosts,
    }
