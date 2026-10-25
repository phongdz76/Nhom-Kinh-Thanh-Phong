import { withPayload } from "@payloadcms/next/withPayload";
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isolate verification builds from an already running development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: [
    "payload",
    "@payloadcms/db-postgres",
    "@payloadcms/storage-s3",
    "sharp",
    "pg",
    "exceljs",
    "docx",
  ],
};

export default withPayload(nextConfig);
