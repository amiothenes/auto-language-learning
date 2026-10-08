CREATE TABLE "reader_sync_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"highlight_intensity" integer DEFAULT 100 NOT NULL,
	"show_well_known_words" boolean DEFAULT true NOT NULL,
	"highlight_mode" text DEFAULT 'highlight' NOT NULL,
	"playback_speed" real DEFAULT 0.9 NOT NULL,
	"preferred_voices" json DEFAULT '{}'::json NOT NULL,
	"tutor_mode_enabled" boolean DEFAULT false NOT NULL,
	"tutor_mode_timing" text DEFAULT 'atWord' NOT NULL,
	"tutor_mode_threshold" text DEFAULT 'FAMILIAR' NOT NULL,
	"tutor_mode_max_per_sentence" integer DEFAULT 2 NOT NULL,
	"tutor_mode_resume" text DEFAULT 'onDismiss' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reader_sync_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "srs_settings" ADD COLUMN "exclude_sentences_from" text DEFAULT 'incomplete' NOT NULL;