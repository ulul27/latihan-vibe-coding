import { mysqlTable, serial, varchar, timestamp, int } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createAt: timestamp("create_at").defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id").references(() => users.id),
  createAt: timestamp("create_at").defaultNow(),
});

