import { serial, text, timestamp, integer, pgTable, AnyPgColumn } from "drizzle-orm/pg-core"
import { users } from "./users"

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  replyId: integer("reply_id").references((): AnyPgColumn => posts.id), // Explicitly set the return type because of TypeScript limitations
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
