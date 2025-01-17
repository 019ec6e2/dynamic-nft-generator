import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const nftTransactions = pgTable("nft_transactions", {
  id: serial("id").primaryKey(),
  signature: text("signature").unique().notNull(),
  mint: text("mint").notNull(),
  name: text("name"),
  buyer: text("buyer").notNull(),
  seller: text("seller").notNull(),
  amount: numeric("amount").notNull(),
  amountInLamports: numeric("amount_in_lamports").notNull(),
  currency: text("currency").notNull(),
  marketplace: text("marketplace").notNull(),
  type: text("type").notNull(),
  blocktime: timestamp("blocktime").notNull(),
  image: text("image"),
  marketplacefee: text("marketplace_fee"),
  royaltyfee: text("royalty_fee"),
  evolvedTx: text("evolved_tx"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertNftTransactionSchema = createInsertSchema(nftTransactions);
export const selectNftTransactionSchema = createSelectSchema(nftTransactions);
export type InsertNftTransaction = typeof nftTransactions.$inferInsert;
export type SelectNftTransaction = typeof nftTransactions.$inferSelect;