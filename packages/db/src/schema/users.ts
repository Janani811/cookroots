import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["viewer", "creator", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  dietaryPreferences: text("dietary_preferences").array(),
  location: text("location"),
  website: text("website"),
  instagram: text("instagram"),
  role: userRoleEnum("role").notNull().default("viewer"),
  firebaseUid: text("firebase_uid").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});
