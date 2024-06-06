# Segmentation Lookups

Motifs can be visualized using Neuroglancer if their records in the `config.json` file have a `volumetric_data.uri` attribute:


For example:

```json
{
    "id": "Helmstaedter_2013",
    "name": "Helmstaedter et al. 2013 Mouse Retina",
    "uri": "file://$/data/mouse_retina_1.graphml",
    "volumetric_data": {
        "uri": "precomputed://s3://bossdb-open-data/helmstaedter13/mouse_retina/e2006_segmentation_recol",
        "other_channels": [
            "precomputed://s3://bossdb-open-data/helmstaedter13/mouse_retina/080823_e2006_mouseHRP_mag1"
        ],
    },
    "provider": {"@id": "FilesystemGraphHostProvider"},
},
```

Here, the `volumetric_data.uri` attribute will be used as the segmentation for the visualized link, and `volumetric_data.other_channels` will be rendered alongside. (This is a good spot for, say, the underlying imagery.)

By default, the vertex ID is assumed to be the same as the segmentation ID in the volumetric data. If you have alternative mappings (e.g., vertex ID is the cell "name"), you can populate the `__segmentation_id__` attribute on the _graph vertices_, and these will be used instead when generating neuroglancer links. The motif search results will still show the vertex IDs.
