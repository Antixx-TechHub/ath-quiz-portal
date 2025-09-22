// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  compiler: { removeConsole: isProd },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,   // optional: better SPA nav caching
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    navigateFallback: '/',
  },
  disable: !isProd,           // keep PWA off in dev
})(config)
