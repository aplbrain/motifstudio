from typing import Annotated
from fastapi import APIRouter, Depends
from ...models import HostProviderPublicListing
from ..commons import HostProviderRouterGlobalDep, provider_router

router = APIRouter(prefix="/providers", tags=["providers"], dependencies=[Depends(provider_router)])


@router.get("/")
def list_host_providers(
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)]
) -> dict[str, list[HostProviderPublicListing]]:
    """
    Get a list of all host providers that are currently registered with the
    server's provider router.

    """
    return {
        "host_providers": [
            HostProviderPublicListing(provider_type=provider.type) for provider in commons.all_providers()
        ]
    }


@router.get("/hostlist")
def list_hosts(commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)]) -> dict[str, list[str]]:
    """
    Get a list of all hosts that are currently registered with the server's
    provider router. This returns a dictionary with a single key, "hosts",
    which maps to a list of host names. Note that these are public-facing host
    *names*, not host *URIs*.

    """
    return {"hosts": [host.name for host in commons.all_hosts]}
