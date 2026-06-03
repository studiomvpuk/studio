/** @type {import('next').NextConfig} */

// Public base URL for project images. Prefer an explicit override, otherwise
// reuse the R2 bucket's public URL (S3_PUBLIC_URL). Exposed to the browser as
// NEXT_PUBLIC_ASSET_BASE_URL so client components can build image URLs.
const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.S3_PUBLIC_URL || "";

const nextConfig = {
  env: {
    NEXT_PUBLIC_ASSET_BASE_URL: ASSET_BASE,
  },
};

export default nextConfig;
