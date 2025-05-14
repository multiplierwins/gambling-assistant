import { pgTable, text, serial, integer, timestamp, boolean, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  cash: integer("cash").notNull().default(1000),
  level: integer("level").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  highestWin: integer("highest_win").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  games: many(games),
  cooldowns: many(cooldowns),
  leaderboard: many(leaderboard),
}));

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(), // 'blackjack', 'coinflip', 'crash', etc.
  bet: integer("bet").notNull(),
  winnings: integer("winnings"),
  isWin: boolean("is_win"),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const cooldowns = pgTable("cooldowns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'daily', 'work', 'vote', etc.
  expiresAt: timestamp("expires_at").notNull(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  serverId: text("server_id"),
  cashRank: integer("cash_rank"),
  levelRank: integer("level_rank"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  userId: true,
  gameType: true,
  bet: true,
  winnings: true,
  isWin: true,
});

export const insertCooldownSchema = createInsertSchema(cooldowns).pick({
  userId: true,
  type: true,
  expiresAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  userId: true,
  serverId: true,
  cashRank: true,
  levelRank: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Cooldown = typeof cooldowns.$inferSelect;
export type Leaderboard = typeof leaderboard.$inferSelect;

// Game-specific schemas
export const blackjackGameSchema = z.object({
  bet: z.number().int().positive(),
  mode: z.enum(["easy", "hard"]).default("easy"),
});

export const coinflipGameSchema = z.object({
  prediction: z.enum(["heads", "tails"]),
  bet: z.number().int().positive(),
});

export const crashGameSchema = z.object({
  bet: z.number().int().positive(),
  mode: z.enum(["easy", "hard"]).default("easy"),
});

export const findTheLadyGameSchema = z.object({
  bet: z.number().int().positive(),
  mode: z.enum(["easy", "hard"]).default("easy"),
});

export const gambleGameSchema = z.object({
  bet: z.number().int().positive(),
  mode: z.enum(["easy", "hard"]).default("easy"),
});

export const slotMachineGameSchema = z.object({
  bet: z.number().int().positive(),
  lines: z.number().int().min(1).max(5).default(1),
});

// Utility for parsing bet amounts that can include suffixes like 'k', 'm', etc.
export const parseBetAmount = (betStr: string, maxBet?: number): number => {
  if (!betStr) return 0;
  
  if (betStr.toLowerCase() === 'm' || betStr.toLowerCase() === 'max') {
    return maxBet || 1000;
  }
  
  if (betStr.toLowerCase() === 'a' || betStr.toLowerCase() === 'allin') {
    return maxBet || 1000; // This would be the user's full cash amount
  }
  
  const multipliers: Record<string, number> = {
    k: 1_000,
    m: 1_000_000,
    g: 1_000_000_000,
    t: 1_000_000_000_000,
    p: 1_000_000_000_000_000,
    e: 1_000_000_000_000_000_000,
    z: 1_000_000_000_000_000_000_000,
    y: 1_000_000_000_000_000_000_000_000,
  };
  
  const match = betStr.match(/^(\d+)([kmgtpezy])?$/i);
  if (!match) return 0;
  
  const [, amount, suffix] = match;
  let value = parseInt(amount, 10);
  
  if (suffix && multipliers[suffix.toLowerCase()]) {
    value *= multipliers[suffix.toLowerCase()];
  }
  
  return value;
};

// Calculate XP required for a given level
export const xpForLevel = (level: number): number => {
  return Math.floor(1000 * Math.pow(1.5, level));
};

// Calculate level from XP
export const levelFromXP = (xp: number): number => {
  return Math.floor(Math.log(xp / 1000) / Math.log(1.5));
};
