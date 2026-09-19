CREATE TYPE "public"."recipe_visibility" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "visibility" "recipe_visibility" DEFAULT 'public' NOT NULL;