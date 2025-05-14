import { pgTable, text, serial, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Shop items table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(), // 'boost', 'cosmetic', 'collectible', etc.
  category: text("category").notNull(), // 'gambling', 'economy', 'general', etc.
  effects: jsonb("effects"), // Stores effect details like multipliers, bonuses, etc.
  duration: integer("duration"), // Duration in seconds, null for permanent items
  image: text("image"), // URL or path to the item image
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User inventory table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
  isActive: boolean("is_active").default(false),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Active boosts table
export const activeBoosts = pgTable("active_boosts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemId: integer("item_id").notNull().references(() => items.id),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id),
  multiplier: real("multiplier").notNull().default(1),
  boostType: text("boost_type").notNull(), // 'win', 'xp', 'cashback', etc.
  startedAt: timestamp("started_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  inventoryEntries: many(inventory),
  activeBoosts: many(activeBoosts),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
  activeBoosts: many(activeBoosts),
}));

export const activeBoostsRelations = relations(activeBoosts, ({ one }) => ({
  item: one(items, {
    fields: [activeBoosts.itemId],
    references: [items.id],
  }),
  inventoryEntry: one(inventory, {
    fields: [activeBoosts.inventoryId],
    references: [inventory.id],
  }),
}));

// Schemas for Zod validation
export const insertItemSchema = createInsertSchema(items).pick({
  name: true,
  description: true,
  price: true,
  type: true,
  category: true,
  effects: true,
  duration: true,
  image: true,
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  userId: true,
  itemId: true,
  quantity: true,
  isActive: true,
  activatedAt: true,
  expiresAt: true,
});

export const insertActiveBoostSchema = createInsertSchema(activeBoosts).pick({
  userId: true,
  itemId: true,
  inventoryId: true,
  multiplier: true,
  boostType: true,
  expiresAt: true,
});

// Type definitions
export type Item = typeof items.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type ActiveBoost = typeof activeBoosts.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertActiveBoost = z.infer<typeof insertActiveBoostSchema>;