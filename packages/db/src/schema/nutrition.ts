import { integer, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const healthBadgeEnum = pgEnum("health_badge", [
  "healthy",
  "high_protein",
  "low_calorie",
  "vegan",
  "vegetarian",
]);

export const recipeNutrition = pgTable("recipe_nutrition", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" })
    .unique(),
  calories: integer("calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
});

export const recipeBadges = pgTable("recipe_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  badge: healthBadgeEnum("badge").notNull(),
});
