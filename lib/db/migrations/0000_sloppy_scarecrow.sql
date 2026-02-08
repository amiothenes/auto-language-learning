CREATE TABLE "languages" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_rtl" boolean DEFAULT false NOT NULL,
	"dict_uri" text,
	"translate_uri" text,
	"google_tts_code" text,
	"character_substitutions" json,
	"sentence_split_regex" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
