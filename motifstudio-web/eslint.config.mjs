import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
    ...coreWebVitals,
    ...nextTypescript,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "react-hooks/immutability": "off",
            "react-hooks/refs": "off",
            "react-hooks/set-state-in-effect": "off",
        },
    },
];

export default config;
