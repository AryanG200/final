/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      "res.cloudinary.com"
    ],
  },
};

export default nextConfig;
