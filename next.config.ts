import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/v1/:path*',
        destination: 'https://ptxzfsqovlsbbobdnfoe.supabase.co/auth/v1/:path*',
      },
    ]
  },
}

export default nextConfig