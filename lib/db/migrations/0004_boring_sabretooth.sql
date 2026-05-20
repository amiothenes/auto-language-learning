ALTER TYPE "public"."vocabulary_status" ADD VALUE 'UNKNOWN' BEFORE 'NEWLY_SEEN';--> statement-breakpoint
ALTER TABLE "words" ALTER COLUMN "status" SET DEFAULT 'UNKNOWN';--> statement-breakpoint
ALTER TABLE "word_instances" ADD COLUMN "pos" text;--> statement-breakpoint
CREATE INDEX "word_instances_pos_idx" ON "word_instances" USING btree ("pos");