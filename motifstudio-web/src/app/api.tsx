// Base URL based on dev status:
// @ts-ignore
export const BASE_URL =
    process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://api.motifstudio.bossdb.org";

// export const BASE_URL = "https://api.motifstudio.bossdb.org";

export const neuroglancerUrlFromHostVolumetricData = (
    segmentationUri: string,
    otherChannels: string[],
    focusedSegments: number[]
): string => {
    const state = {
        layers: [
            ...otherChannels.map((channel) => ({
                type: "image",
                source: channel,
                tab: "source",
                name: channel.split("/").pop(),
            })),
            {
                type: "segmentation",
                source: segmentationUri,
                tab: "segments",
                segments: focusedSegments.length ? focusedSegments.map((i) => i?.toString()) || [] : [],
                name: "segmentation",
            },
        ],
        selectedLayer: {
            visible: true,
            layer: "segmentation",
        },
    };

    return `https://neuroglancer.bossdb.io/#!` + JSON.stringify(state);
};

export const fetcher = async (...args: any[]) => {
    const res = await fetch(...(args as [RequestInfo, RequestInit]));
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.detail || data?.error || `Request failed with status ${res.status}`);
    }
    return data;
};

export const bodiedFetcher = async (url: string, body: any, init: RequestInit = {}) => {
    return fetcher(url, {
        ...init,
        method: "POST",
        headers: {
            ...init.headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
};

export type HostListing = {
    id: string;
    uri: string;
    name: string;
    provider: { [key: string]: string };
    volumetric_data?: { [key: string]: any };
};
