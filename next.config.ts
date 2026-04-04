import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/1brong',     // GitHub Pages 서브경로 필수
  assetPrefix: '/1brong',  // JS/CSS 파일 경로 보정
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
