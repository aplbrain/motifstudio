import io

import pytest
from fastapi import HTTPException, UploadFile

from . import uploads


class StubCommons:
    def __init__(self):
        self.temporary_hosts = []
        self.host_provider_router = StubHostProviderRouter()

    def add_temporary_host(self, host):
        self.temporary_hosts.append(host)


class StubHostProviderRouter:
    def __init__(self):
        self._providers = {"TemporaryGraphHostProvider": uploads._temp_provider}


@pytest.mark.asyncio
async def test_upload_rejects_pickle_files():
    upload = UploadFile(filename="malicious.gpickle", file=io.BytesIO(b"not actually a pickle"))

    with pytest.raises(HTTPException) as error:
        await uploads.upload_graph(upload, commons=StubCommons())

    assert error.value.status_code == 415


@pytest.mark.asyncio
async def test_upload_rejects_files_over_size_limit(monkeypatch):
    monkeypatch.setattr(uploads, "MAX_UPLOAD_BYTES", 3)
    upload = UploadFile(filename="graph.graphml", file=io.BytesIO(b"four"))

    with pytest.raises(HTTPException) as error:
        await uploads.upload_graph(upload, commons=StubCommons())

    assert error.value.status_code == 413


@pytest.mark.asyncio
async def test_upload_rejects_empty_files():
    upload = UploadFile(filename="graph.graphml", file=io.BytesIO())

    with pytest.raises(HTTPException) as error:
        await uploads.upload_graph(upload, commons=StubCommons())

    assert error.value.status_code == 400
