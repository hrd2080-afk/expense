import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',          value: 'no-store, no-cache, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/'                                   },
        ],
      },
    ];
  },
};

export default nextConfig;
