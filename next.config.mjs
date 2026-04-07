/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH || undefined,
  output: "standalone",
  productionBrowserSourceMaps: true,
}

export default nextConfig
