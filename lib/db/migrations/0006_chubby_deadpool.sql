ALTER TABLE "languages" DROP CONSTRAINT "languages_code_unique";--> statement-breakpoint
ALTER TABLE "words" DROP CONSTRAINT "words_lemma_language_id_unique";--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "texts" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_code_user_id_unique" UNIQUE("code","user_id");--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_lemma_language_id_user_id_unique" UNIQUE("lemma","language_id","user_id");