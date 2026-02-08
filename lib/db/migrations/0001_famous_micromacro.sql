CREATE TYPE "public"."vocabulary_status" AS ENUM('NEWLY_SEEN', 'FAMILIAR', 'KNOWN', 'WELL_KNOWN', 'IGNORE');--> statement-breakpoint
CREATE TABLE "words" (
	"id" text PRIMARY KEY NOT NULL,
	"lemma" text NOT NULL,
	"language_id" text NOT NULL,
	"status" "vocabulary_status" DEFAULT 'NEWLY_SEEN' NOT NULL,
	"translation" text,
	"definition" text,
	"romanization" text,
	"example_sentence" text,
	"dictionary_frequency" integer DEFAULT 0 NOT NULL,
	"user_frequency" integer DEFAULT 1 NOT NULL,
	"status_changed_at" timestamp DEFAULT now() NOT NULL,
	"last_practiced_at" timestamp DEFAULT now() NOT NULL,
	"today_score" integer DEFAULT 0 NOT NULL,
	"tomorrow_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "words_lemma_language_id_unique" UNIQUE("lemma","language_id")
);
--> statement-breakpoint
CREATE TABLE "word_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"text_id" text NOT NULL,
	"word_id" text NOT NULL,
	"sentence_id" text,
	"surface_form" text NOT NULL,
	"position" integer NOT NULL,
	"inflection_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"language_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "texts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"language_id" text NOT NULL,
	"series_id" text,
	"audio_uri" text,
	"source_uri" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"unique_word_count" integer DEFAULT 0 NOT NULL,
	"known_percentage" real DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentences" (
	"id" text PRIMARY KEY NOT NULL,
	"text_id" text NOT NULL,
	"content" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '0 0% 50%' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "pos_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "pos_tags_word_id_tag_id_unique" UNIQUE("word_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "text_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"text_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "text_tags_text_id_tag_id_unique" UNIQUE("text_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_instances" ADD CONSTRAINT "word_instances_text_id_texts_id_fk" FOREIGN KEY ("text_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_instances" ADD CONSTRAINT "word_instances_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_instances" ADD CONSTRAINT "word_instances_sentence_id_sentences_id_fk" FOREIGN KEY ("sentence_id") REFERENCES "public"."sentences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "texts" ADD CONSTRAINT "texts_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "texts" ADD CONSTRAINT "texts_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentences" ADD CONSTRAINT "sentences_text_id_texts_id_fk" FOREIGN KEY ("text_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_tags" ADD CONSTRAINT "pos_tags_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_tags" ADD CONSTRAINT "pos_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_tags" ADD CONSTRAINT "text_tags_text_id_texts_id_fk" FOREIGN KEY ("text_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_tags" ADD CONSTRAINT "text_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "words_status_idx" ON "words" USING btree ("status");--> statement-breakpoint
CREATE INDEX "words_lemma_idx" ON "words" USING btree ("lemma");--> statement-breakpoint
CREATE INDEX "words_language_id_idx" ON "words" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "words_dictionary_frequency_idx" ON "words" USING btree ("dictionary_frequency");--> statement-breakpoint
CREATE INDEX "words_user_frequency_idx" ON "words" USING btree ("user_frequency");--> statement-breakpoint
CREATE INDEX "word_instances_text_id_idx" ON "word_instances" USING btree ("text_id");--> statement-breakpoint
CREATE INDEX "word_instances_word_id_idx" ON "word_instances" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "word_instances_sentence_id_idx" ON "word_instances" USING btree ("sentence_id");--> statement-breakpoint
CREATE INDEX "word_instances_position_idx" ON "word_instances" USING btree ("position");--> statement-breakpoint
CREATE INDEX "series_language_id_idx" ON "series" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "texts_language_id_idx" ON "texts" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "texts_series_id_idx" ON "texts" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "texts_last_viewed_at_idx" ON "texts" USING btree ("last_viewed_at");--> statement-breakpoint
CREATE INDEX "texts_known_percentage_idx" ON "texts" USING btree ("known_percentage");--> statement-breakpoint
CREATE INDEX "sentences_text_id_idx" ON "sentences" USING btree ("text_id");--> statement-breakpoint
CREATE INDEX "sentences_text_id_order_idx" ON "sentences" USING btree ("text_id","order");--> statement-breakpoint
CREATE INDEX "pos_tags_word_id_idx" ON "pos_tags" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "pos_tags_tag_id_idx" ON "pos_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "text_tags_text_id_idx" ON "text_tags" USING btree ("text_id");--> statement-breakpoint
CREATE INDEX "text_tags_tag_id_idx" ON "text_tags" USING btree ("tag_id");