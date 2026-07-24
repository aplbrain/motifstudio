import json
from pathlib import Path

from .temporary_graph_host_provider import TemporaryGraphHostProvider


def _stage_file(directory: Path, name: str) -> str:
    path = directory / name
    path.write_text("source,target\na,b\n")
    return str(path)


def test_multiple_providers_preserve_each_others_uploads(tmp_path):
    first = TemporaryGraphHostProvider(str(tmp_path))
    second = TemporaryGraphHostProvider(str(tmp_path))

    first_id = first.store_file(_stage_file(tmp_path, "first.csv"), "first.csv")
    second_id = second.store_file(_stage_file(tmp_path, "second.csv"), "second.csv")

    assert set(first.list_temporary_files()) == {first_id, second_id}
    assert set(second.list_temporary_files()) == {first_id, second_id}


def test_metadata_replacement_always_produces_valid_json(tmp_path):
    provider = TemporaryGraphHostProvider(str(tmp_path))
    provider.store_file(_stage_file(tmp_path, "graph.csv"), "graph.csv")

    metadata = Path(provider.metadata_file)
    assert json.loads(metadata.read_text())
    assert not list(metadata.parent.glob("metadata.*.tmp"))


def test_display_name_survives_provider_restart(tmp_path):
    provider = TemporaryGraphHostProvider(str(tmp_path))
    temp_id = provider.store_file(_stage_file(tmp_path, "graph.csv"), "graph.csv", "My graph")

    restarted = TemporaryGraphHostProvider(str(tmp_path))

    assert restarted.get_file_info(temp_id)["display_name"] == "My graph"
