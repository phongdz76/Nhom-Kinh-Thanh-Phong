import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "estimates" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"project_address" varchar,
  	"total" numeric NOT NULL,
  	"document" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "estimates_id" uuid;
  CREATE UNIQUE INDEX "estimates_code_idx" ON "estimates" USING btree ("code");
  CREATE INDEX "estimates_updated_at_idx" ON "estimates" USING btree ("updated_at");
  CREATE INDEX "estimates_created_at_idx" ON "estimates" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_estimates_fk" FOREIGN KEY ("estimates_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_estimates_id_idx" ON "payload_locked_documents_rels" USING btree ("estimates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_estimates_fk";
  
  DROP INDEX "payload_locked_documents_rels_estimates_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "estimates_id";
  DROP TABLE "estimates";`)
}
