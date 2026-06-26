CREATE TABLE "word_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"target_lang_code" text NOT NULL,
	"translation" text,
	"meanings" json,
	"example_sentence" text,
	"example_sentence_translation" text,
	"source" text DEFAULT 'azure' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_translations_word_lang_unique" UNIQUE("word_id","target_lang_code")
);
--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "include_foreign_script" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "default_translation_lang_code" text;--> statement-breakpoint
ALTER TABLE "texts" ADD COLUMN "last_paragraph_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "word_translations" ADD CONSTRAINT "word_translations_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "word_translations_word_id_idx" ON "word_translations" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "word_translations_target_lang_idx" ON "word_translations" USING btree ("target_lang_code");