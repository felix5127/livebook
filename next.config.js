/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 暂时忽略构建时的ESLint错误
    ignoreDuringBuilds: true,
  },
  // 环境变量配置
  env: {
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    DASHSCOPE_API_URL: process.env.DASHSCOPE_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // 实验性功能配置
  experimental: {
    // 针对App Router的大文件上传配置
    serverComponentsExternalPackages: [],
    // 启用优化的CSS加载
    optimizeCss: true,
    // 启用turbo模式（如果可用）
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // 生产优化配置
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24小时
    domains: [
      'localhost',
      'gw.alipayobjects.com', // 测试音频域名
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 国际化配置（如果需要）
  i18n: {
    locales: ['zh-CN', 'en'],
    defaultLocale: 'zh-CN',
    localeDetection: false,
  },

  // 安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https: wss:; media-src 'self' blob: https:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self';"
          }
        ],
      },
    ];
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // API路由配置
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Webpack配置优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 修复模块解析问题
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    // 生产环境优化
    if (!dev && !isServer) {
      // 优化chunk分割策略
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            default: false,
            vendors: false,
            // 第三方库chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              enforce: true,
            },
            // React相关库单独分组
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // UI组件库
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              priority: 25,
              enforce: true,
            },
            // 通用模块
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };

      // 添加Bundle分析插件（开发环境）
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analyzer.html',
          })
        );
      }
    }

    // 忽略某些模块以减少bundle大小
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    return config;
  },
};

module.exports = nextConfig;