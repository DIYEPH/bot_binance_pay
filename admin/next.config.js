/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ sqlite3: 'commonjs sqlite3', 'sync-mysql': 'commonjs sync-mysql' });
    }
    return config;
  }
};

module.exports = nextConfig;
