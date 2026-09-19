CREATE INDEX "words_user_id_idx" ON "words" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "series_user_id_idx" ON "series" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "texts_user_id_idx" ON "texts" USING btree ("user_id");