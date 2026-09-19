import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const recipeTranslations = pgTable(
  "recipe_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    ingredients: jsonb("ingredients").notNull(),
    steps: jsonb("steps").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.recipeId, table.language)],
);
