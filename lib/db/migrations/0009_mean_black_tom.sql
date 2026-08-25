CREATE TABLE "word_audio" (
	"id" text PRIMARY KEY NOT NULL,
	"lemma" text NOT NULL,
	"language_code" text NOT NULL,
	"voice_id" text NOT NULL,
	"rate_percent" integer NOT NULL,
	"storage_path" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_audio_lemma_lang_voice_rate_unique" UNIQUE("lemma","language_code","voice_id","rate_percent")
);
--> statement-breakpoint
CREATE TABLE "sentence_audio" (
	"id" text PRIMARY KEY NOT NULL,
	"content_hash" text NOT NULL,
	"language_code" text NOT NULL,
	"voice_id" text NOT NULL,
	"rate_percent" integer NOT NULL,
	"storage_path" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"marks" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sentence_audio_hash_lang_voice_rate_unique" UNIQUE("content_hash","language_code","voice_id","rate_percent")
);
--> statement-breakpoint
CREATE INDEX "word_audio_lemma_lang_idx" ON "word_audio" USING btree ("lemma","language_code");--> statement-breakpoint
CREATE INDEX "sentence_audio_hash_lang_idx" ON "sentence_audio" USING btree ("content_hash","language_code");