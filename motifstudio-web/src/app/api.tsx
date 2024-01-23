// Base URL based on dev status:
// @ts-ignore
export const BASE_URL =
    process.env.NODE_ENV === "development" ? "http://localhost:5000" : "https://api.motifstudio.bossdb.org";

export const neuroglancerUrlFromHostVolumetricData = (
    segmentationUri: string,
    otherChannels: string[],
    focusedSegments: number[]
): string => {
    console.log(focusedSegments);
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
    return res.json();
};

export const bodiedFetcher = async (url: string, body: any, ...args: any[]) => {
    return fetcher(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
};

export type HostListing = { name: string; id: string };
