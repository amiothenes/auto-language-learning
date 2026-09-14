CREATE TABLE "word_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"user_id" text NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_reviews_word_id_unique" UNIQUE("word_id")
);
--> statement-breakpoint
CREATE TABLE "srs_daily_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"language_id" text NOT NULL,
	"date" date NOT NULL,
	"new_introduced_count" integer DEFAULT 0 NOT NULL,
	"reviews_completed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "srs_daily_stats_user_language_date_unique" UNIQUE("user_id","language_id","date")
);
--> statement-breakpoint
CREATE TABLE "srs_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"language_id" text NOT NULL,
	"new_cards_per_day" integer DEFAULT 20 NOT NULL,
	"reviews_per_day" integer DEFAULT 100,
	"min_eligible_status" "vocabulary_status" DEFAULT 'NEWLY_SEEN' NOT NULL,
	"max_eligible_status" "vocabulary_status" DEFAULT 'KNOWN' NOT NULL,
	"type_switch_status" "vocabulary_status" DEFAULT 'FAMILIAR' NOT NULL,
	"sentence_audio_enabled" boolean DEFAULT true NOT NULL,
	"word_audio_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "srs_settings_user_language_unique" UNIQUE("user_id","language_id")
);
--> statement-breakpoint
ALTER TABLE "word_reviews" ADD CONSTRAINT "word_reviews_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_daily_stats" ADD CONSTRAINT "srs_daily_stats_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_settings" ADD CONSTRAINT "srs_settings_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "word_reviews_user_due_idx" ON "word_reviews" USING btree ("user_id","due_at");