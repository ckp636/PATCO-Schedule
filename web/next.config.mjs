/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/stations', destination: '/map', permanent: true },
    ]
  },
};

export default nextConfig;
