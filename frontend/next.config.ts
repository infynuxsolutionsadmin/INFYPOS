import type { NextConfig } from 'next';
import path from 'path';

const d3Aliases = {
  'victory-vendor/d3-array': 'd3-array',
  'victory-vendor/es/d3-array': 'd3-array',
  'victory-vendor/d3-ease': 'd3-ease',
  'victory-vendor/es/d3-ease': 'd3-ease',
  'victory-vendor/d3-interpolate': 'd3-interpolate',
  'victory-vendor/es/d3-interpolate': 'd3-interpolate',
  'victory-vendor/d3-scale': 'd3-scale',
  'victory-vendor/es/d3-scale': 'd3-scale',
  'victory-vendor/d3-shape': 'd3-shape',
  'victory-vendor/es/d3-shape': 'd3-shape',
  'victory-vendor/d3-time': 'd3-time',
  'victory-vendor/es/d3-time': 'd3-time',
  'victory-vendor/d3-timer': 'd3-timer',
  'victory-vendor/es/d3-timer': 'd3-timer',
};

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
    resolveAlias: d3Aliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...d3Aliases,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:3000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
