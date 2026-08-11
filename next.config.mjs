/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/pipaline',
        destination: '/pipeline',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
