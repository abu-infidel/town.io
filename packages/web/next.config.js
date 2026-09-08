/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        // The browser only ever talks to same-origin /api/*; Caddy proxies
        // that to the Express api service in production, and this rewrite
        // does the equivalent during local `next dev`.
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
