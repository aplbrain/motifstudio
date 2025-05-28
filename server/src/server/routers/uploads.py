"""Routes for graph upload and temporary file management."""

import datetime
import os
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from ...models import (
    GraphUploadResponse,
    TemporaryHostListing,
    GraphUploadCleanupResponse,
    HostListing
)
from ..commons import HostProviderRouterGlobalDep, provider_router
from ...host_provider.host_provider.temporary_graph_host_provider import TemporaryGraphHostProvider

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"],
    dependencies=[Depends(provider_router)]
)

# Global temporary provider instance
# This will be shared across all requests
_temp_provider = TemporaryGraphHostProvider()


@router.post("/graph", response_model=GraphUploadResponse)
async def upload_graph(
    file: UploadFile = File(...),
    name: str = Form(None),
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)] = None
) -> GraphUploadResponse:
    """Upload a graph file temporarily.
    
    Supported formats: GraphML, GEXF, GML, CSV (edgelist), and their gzipped versions.
    """
    try:
        # Check file extension
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Store the file temporarily
        temp_id = _temp_provider.store_file(content, file.filename)
        
        # Generate a display name
        display_name = name or file.filename
        
        # Add temporary host to the router with proper HostListing
        temp_uri = f"temp://{temp_id}"
        temp_host = HostListing(
            id=temp_id,
            uri=temp_uri,
            name=display_name,
            provider={"@id": "TemporaryGraphHostProvider"},
            volumetric_data={}
        )
        
        # Add to the temporary hosts list (unlisted, only accessible by ID)
        commons.add_temporary_host(temp_host)
        
        # Also register the temporary provider if not already registered
        if "TemporaryGraphHostProvider" not in commons.host_provider_router._providers:
            commons.host_provider_router.add_provider("TemporaryGraphHostProvider", _temp_provider)
        
        return GraphUploadResponse(
            temp_id=temp_id,
            original_filename=file.filename,
            file_size=len(content),
            success=True,
            error=None
        )
        
    except Exception as e:
        return GraphUploadResponse(
            temp_id="",
            original_filename=file.filename or "unknown",
            file_size=0,
            success=False,
            error=str(e)
        )


@router.get("/temporary", response_model=List[TemporaryHostListing])
def list_temporary_graphs(
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)] = None
) -> List[TemporaryHostListing]:
    """List all temporarily uploaded graphs."""
    temp_files = _temp_provider.list_temporary_files()
    listings = []
    
    for temp_id, filepath in temp_files.items():
        file_info = _temp_provider.get_file_info(temp_id)
        if file_info:
            # Find the corresponding host listing to get the display name
            display_name = os.path.basename(filepath)
            for host in commons.all_hosts:
                if host.id == temp_id:
                    display_name = host.name
                    break
            
            listings.append(TemporaryHostListing(
                temp_id=temp_id,
                name=display_name,
                original_filename=file_info.get("filename", "unknown"),
                file_size=int(file_info.get("size", "0")),
                created_at=file_info.get("created", "unknown")
            ))
    
    return listings


@router.delete("/temporary/{temp_id}", response_model=GraphUploadCleanupResponse)
def cleanup_temporary_graph(
    temp_id: str,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)] = None
) -> GraphUploadCleanupResponse:
    """Clean up a temporarily uploaded graph."""
    try:
        # Remove from temporary hosts list
        commons.remove_temporary_host(temp_id)
        
        # Cleanup the file
        success = _temp_provider.cleanup_file(temp_id)
        
        return GraphUploadCleanupResponse(
            temp_id=temp_id,
            success=success,
            error=None if success else "Failed to cleanup file"
        )
        
    except Exception as e:
        return GraphUploadCleanupResponse(
            temp_id=temp_id,
            success=False,
            error=str(e)
        )


@router.get("/temporary/{temp_id}/info")
def get_temporary_graph_info(
    temp_id: str,
    commons: Annotated[HostProviderRouterGlobalDep, Depends(provider_router)] = None
):
    """Get information about a temporarily uploaded graph."""
    file_info = _temp_provider.get_file_info(temp_id)
    
    if not file_info:
        raise HTTPException(status_code=404, detail="Temporary graph not found")
    
    # Find the corresponding host listing
    host_listing = None
    for host in commons.all_hosts:
        if host.id == temp_id:
            host_listing = host
            break
    
    return {
        "temp_id": temp_id,
        "file_info": file_info,
        "host_listing": host_listing
    }


__all__ = ["router"]
