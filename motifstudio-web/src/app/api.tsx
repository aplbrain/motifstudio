// Base URL based on dev status:
// @ts-ignore
export const BASE_URL = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://api.motifstudio.bossdb.org";

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
