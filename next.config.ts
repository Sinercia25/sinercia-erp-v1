/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ceobot/chat-prod',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig