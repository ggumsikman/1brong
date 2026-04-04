import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',        // 정적 HTML로 빌드 (GitHub Pages용)
  trailingSlash: true,     // GitHub Pages 경로 호환
  images: {
    unoptimized: true,     // 정적 export 시 이미지 최적화 비활성화
  },
};

export default nextConfig;
