import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "like",
  "comment",
  "reply",
  "rating",
  "tried",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Recipient — the user who should see this notification (the recipe owner).
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Actor — the user whose action triggered it.
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  recipeId: uuid("recipe_id").references(() => recipes.id, {
    onDelete: "cascade",
  }),
  // Optional extra context (e.g. the rating value, or a comment excerpt).
  data: text("data"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
