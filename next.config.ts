const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    turbo: {
      enabled: false,
    },
  },
}
export default nextConfig
