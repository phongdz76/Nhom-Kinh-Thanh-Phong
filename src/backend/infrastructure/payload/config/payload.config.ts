import path from "node:path";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import {
  mediaURL,
  objectStorage,
} from "@/backend/infrastructure/storage/config";
import {
  collections,
  siteSettings,
} from "@/backend/infrastructure/payload/collections/backend";

const storage = objectStorage(process.env);
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32)
  throw new Error("PAYLOAD_SECRET must contain at least 32 characters.");
if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is required. Run the local setup first.");

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.SERVER_URL || "http://localhost:3000",
  cookiePrefix: "thanhphong",
  admin: { user: "users" },
  telemetry: false,
  typescript: { autoGenerate: false },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      statement_timeout: 15000,
    },
    idType: "uuid",
    push: false,
    migrationDir: path.resolve("src/backend/infrastructure/payload/migrations"),
  }),
  collections,
  globals: [siteSettings],
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          skipVerify: true,
          defaultFromAddress: process.env.SMTP_FROM || "",
          defaultFromName: "Thanh Phong",
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_PORT === "465",
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            ...(process.env.SMTP_USER
              ? {
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                  },
                }
              : {}),
          },
        }),
      }
    : {
        email: () => ({
          name: "not-configured",
          defaultFromAddress: "",
          defaultFromName: "Thanh Phong",
          sendEmail: async () => {
            throw new Error("Email transport is not configured.");
          },
        }),
      }),
  plugins: storage
    ? [
        s3Storage({
          collections: {
            media: {
              generateFileURL: ({ filename }) => mediaURL(storage, filename),
            },
          },
          bucket: storage.bucket,
          config: {
            endpoint: storage.endpoint,
            region: storage.region,
            forcePathStyle: true,
            credentials: {
              accessKeyId: storage.accessKeyId,
              secretAccessKey: storage.secretAccessKey,
            },
          },
        }),
      ]
    : [],
  jobs: {
    deleteJobOnComplete: false,
    access: { run: () => false, queue: () => false },
    tasks: [
      {
        slug: "notify-lead",
        inputSchema: [{ name: "leadId", type: "text", required: true }],
        retries: {
          attempts: 4,
          backoff: { type: "exponential", delay: 60000 },
        },
        handler: async ({ input, req }) => {
          const lead = await req.payload.findByID({
            collection: "leads",
            id: String(input.leadId),
            depth: 0,
          });
          if (lead.notificationState === "sent") return { output: {} };
          if (!process.env.SMTP_HOST || !process.env.LEAD_NOTIFICATION_EMAIL) {
            await req.payload.update({
              collection: "leads",
              id: lead.id,
              data: { notificationState: "not_configured" },
            });
            throw new Error(
              "Notification email is not configured. The lead remains available in admin.",
            );
          }
          try {
            await req.payload.sendEmail({
              to: process.env.LEAD_NOTIFICATION_EMAIL,
              subject: `Thanh Phong: yêu cầu mới ${lead.code}`,
              text: `Có yêu cầu tư vấn mới: ${lead.code}. Đăng nhập để xử lý: ${process.env.SERVER_URL}/admin?tab=leads`,
            });
            await req.payload.update({
              collection: "leads",
              id: lead.id,
              data: {
                notificationState: "sent",
                notifiedAt: new Date().toISOString(),
              },
            });
            return { output: {} };
          } catch (error) {
            await req.payload.update({
              collection: "leads",
              id: lead.id,
              data: { notificationState: "failed" },
            });
            throw error;
          }
        },
      },
    ],
  },
});
