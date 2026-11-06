ALTER TABLE "languages" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "onboarding_path" text;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "onboarded_at" timestamp;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "origin" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "deck_order" integer;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "glyph" text;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "kind" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX "words_starter_deck_idx" ON "words" USING btree ("user_id","language_id","deck_order") WHERE "words"."origin" = 'starter_deck';--> statement-breakpoint
CREATE UNIQUE INDEX "series_one_starter_story_idx" ON "series" USING btree ("user_id","language_id") WHERE "series"."kind" = 'starter_story';--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_level_check" CHECK ("languages"."level" IS NULL OR "languages"."level" IN ('A1','A2','B1','B2','C1','C2'));--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_onboarding_path_check" CHECK ("languages"."onboarding_path" IS NULL OR "languages"."onboarding_path" IN ('beginner','placement','self'));--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_origin_check" CHECK ("words"."origin" IN ('text','placement','starter_deck','import'));--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_kind_check" CHECK ("series"."kind" IN ('user','starter_story'));