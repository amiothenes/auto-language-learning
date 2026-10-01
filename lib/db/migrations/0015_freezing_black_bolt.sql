ALTER TABLE "word_reviews" ADD COLUMN "downgrade_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "word_reviews" ADD COLUMN "downgrade_count_date" date;--> statement-breakpoint
ALTER TABLE "srs_settings" ADD COLUMN "max_downgrades_per_day" integer DEFAULT 1;--> statement-breakpoint
CREATE INDEX "words_user_language_status_changed_idx" ON "words" USING btree ("user_id","language_id","status_changed_at");