/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Lets a build run in a separate folder while `next dev` is using .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
