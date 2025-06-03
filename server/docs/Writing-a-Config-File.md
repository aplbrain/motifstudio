# Writing a config file

The server is configured using a `config.json` file in `src/server`. An example configuration file is provided in `src/server/config.example.json`:

```json
{
    "hosts": [
        {
            "id": "Witvliet_1",
            "name": "Witvliet 1",
            "uri": "file://$/example-data/Witvliet2020_D8_Attributed.graphml",
            "provider": {
                "@id": "LocalFilesystemGraphMLHostProvider"
            }
        }
    ],
    "providers": [
        {
            "id": "LocalFilesystemGraphMLHostProvider",
            "type": "FilesystemGraphMLHostProvider",
            "arguments": {}
        }
    ]
}
```

## Adding Hosts

The config file has a top-level `hosts` key, which is an array of host objects. Each host object has a unique `id`, a `name` which is displayed in the UI, a `uri` which is the fully-qualified pointer to the graph data. Each also has a `provider` dict, which contains a pointer to the `provider` that should be used to load that host. The `provider` is a reference to a provider object in the `providers` array, by `id`.

Providers can treat the URI however they want. For example, the `FilesystemGraphMLHostProvider` treats it as a file path, but has the ability to handle `$` variables in the path, which are replaced with the root of this repository.

## Adding Providers

The config file has a top-level `providers` key, which is an array of provider objects. Each provider object has a unique `id`, a `type` which is the name of the provider class, and an `arguments` dict which contains any arguments that should be passed to the provider constructor.

Providers are loaded in order, so if you have multiple providers that can handle the same host, the first one in the list will be used.

## Query Resource Limits

To prevent long-running or memory-intensive queries from affecting server stability, add a `query_limits` section:

```json
"query_limits": {
  "max_ram_pct": 0.5,
  "max_ram_bytes": null,
  "max_duration_seconds": 120
}
```

`max_ram_pct` is the fraction of total system memory to allow (default: 0.5). `max_ram_bytes` is an absolute memory limit in bytes (optional; if set, overrides `max_ram_pct`). `max_duration_seconds` is the maximum wall-clock time in seconds for a query (default: 120).

Note: On non-Linux/Darwin systems, install `psutil` to enable memory limit detection.
