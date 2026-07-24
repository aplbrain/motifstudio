/** @type {import('next').NextConfig} */
const nextConfig = {
    // Build to the "build/" folder instead of the ".next/" folder
    distDir: 'build',

    // Static output:
    output: "export",

    images: { unoptimized: true }
}

module.exports = nextConfig
