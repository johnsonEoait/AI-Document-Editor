import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    // 在生产构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建时忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  // 禁用API路由的预渲染
  experimental: {
    // 禁用预渲染
    disableOptimizedLoading: true,
  },
};

export default nextConfig;
