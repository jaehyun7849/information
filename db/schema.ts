import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const dailyReadings = sqliteTable("daily_readings", {
 id: text("id").primaryKey(), reading: text("reading").notNull(), raw: text("raw").notNull(), updatedAt: text("updated_at").notNull()
});
export const boardStatus = sqliteTable("board_status", { id: text("id").primaryKey(), status: text("status").notNull(), attemptedAt: text("attempted_at").notNull() });
export const evidence = sqliteTable("evidence", { id: text("id").primaryKey(), reading: text("reading").notNull(), raw: text("raw").notNull(), createdAt: text("created_at").notNull() });
