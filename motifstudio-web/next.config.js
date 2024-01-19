/** @type {import('next').NextConfig} */
const nextConfig = {
    // Don't fail the build when there are ESLint errors
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Don't fail the build when there are TypeScript errors
    typescript: {
        ignoreBuildErrors: true,
    },

    // Build to the "build/" folder instead of the ".next/" folder
    distDir: 'build',

    // Static output:
    output: "export",
}

module.exports = nextConfig
