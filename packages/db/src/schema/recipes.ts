import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const recipeDifficultyEnum = pgEnum("recipe_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const recipeStatusEnum = pgEnum("recipe_status", ["draft", "published"]);

export const recipeVisibilityEnum = pgEnum("recipe_visibility", [
  "private",
  "public",
]);

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  rawInput: text("raw_input"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cookingTimeMinutes: integer("cooking_time_minutes"),
  difficulty: recipeDifficultyEnum("difficulty"),
  status: recipeStatusEnum("status").notNull().default("draft"),
  visibility: recipeVisibilityEnum("visibility").notNull().default("public"),
  tags: text("tags").array().notNull().default([]),
  language: text("language"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  normalizedName: text("normalized_name"),
});

export const steps = pgTable("steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  instructionText: text("instruction_text").notNull(),
  audioUrl: text("audio_url"),
});

export const mediaTypeEnum = pgEnum("media_type", ["audio", "image", "video"]);

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  type: mediaTypeEnum("type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
