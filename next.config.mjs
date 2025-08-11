import withPWA from 'next-pwa'

const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  compiler: { removeConsole: isProd },
}

export default withPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
})(config)
