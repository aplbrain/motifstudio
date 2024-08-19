"use client";
import { useRef, useState } from "react";
import { useEffect } from "react";

export function useDebounce(value: any, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle(value: any, delay: number) {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastValue = useRef(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setThrottledValue(lastValue.current);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    useEffect(() => {
        lastValue.current = value;
    }, [value]);

    return throttledValue;
}
