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
