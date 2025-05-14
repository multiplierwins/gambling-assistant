import { users, games, cooldowns, leaderboard, type User, type InsertUser, type Game, type Cooldown, type Leaderboard } from "@shared/schema";
import { items, inventory, activeBoosts, type Item, type Inventory, type ActiveBoost, type InsertItem, type InsertInventory, type InsertActiveBoost } from "@shared/shopSchema";
import { db } from "./db";
import { eq, and, desc, isNull, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Game operations
  createGame(game: Omit<Game, "id" | "playedAt">): Promise<Game>;
  getGamesByUser(userId: number): Promise<Game[]>;
  getGamesByType(gameType: string): Promise<Game[]>;
  
  // Cooldown operations
  getCooldowns(userId: number): Promise<Cooldown[]>;
  setCooldown(cooldown: Omit<Cooldown, "id">): Promise<Cooldown>;
  clearExpiredCooldowns(): Promise<void>;
  
  // Leaderboard operations
  getLeaderboard(serverId?: string): Promise<Leaderboard[]>;
  updateLeaderboardRanking(userId: number, serverId: string | null, updates: Partial<Leaderboard>): Promise<Leaderboard | undefined>;

  // Shop item operations
  getAllItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | undefined>;
  getItemsByCategory(category: string): Promise<Item[]>;
  getItemsByType(type: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  // Inventory operations
  getUserInventory(userId: number): Promise<(Inventory & { item: Item })[]>;
  getInventoryItem(userId: number, itemId: number): Promise<Inventory | undefined>;
  addItemToInventory(inventoryItem: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, updates: Partial<Inventory>): Promise<Inventory | undefined>;
  removeItemFromInventory(id: number): Promise<boolean>;
  
  // Active Boosts operations
  getUserActiveBoosts(userId: number): Promise<(ActiveBoost & { item: Item })[]>;
  getActiveBoostById(id: number): Promise<ActiveBoost | undefined>;
  activateBoost(boost: InsertActiveBoost): Promise<ActiveBoost>;
  deactivateBoost(id: number): Promise<boolean>;
  clearExpiredBoosts(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private cooldowns: Map<number, Cooldown>;
  private leaderboards: Map<number, Leaderboard>;
  
  private userIdCounter: number;
  private gameIdCounter: number;
  private cooldownIdCounter: number;
  private leaderboardIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.cooldowns = new Map();
    this.leaderboards = new Map();
    
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.cooldownIdCounter = 1;
    this.leaderboardIdCounter = 1;
    
    // Add a demo user
    this.createUser({ 
      username: "JohnDoe#1234", 
      password: "password" 
    }).then(user => {
      this.updateUser(user.id, { 
        cash: 1425689, 
        level: 5, 
        xp: 2450,
        wins: 243,
        losses: 198,
        highestWin: 250000
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      cash: 1000, 
      level: 0, 
      xp: 0, 
      wins: 0, 
      losses: 0, 
      highestWin: 0,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Game operations
  async createGame(game: Omit<Game, "id" | "playedAt">): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const newGame: Game = { ...game, id, playedAt: now };
    this.games.set(id, newGame);
    return newGame;
  }
  
  async getGamesByUser(userId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.userId === userId
    );
  }
  
  async getGamesByType(gameType: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.gameType === gameType
    );
  }
  
  // Cooldown operations
  async getCooldowns(userId: number): Promise<Cooldown[]> {
    return Array.from(this.cooldowns.values()).filter(
      (cooldown) => cooldown.userId === userId
    );
  }
  
  async setCooldown(cooldown: Omit<Cooldown, "id">): Promise<Cooldown> {
    const id = this.cooldownIdCounter++;
    const newCooldown: Cooldown = { ...cooldown, id };
    this.cooldowns.set(id, newCooldown);
    return newCooldown;
  }
  
  async clearExpiredCooldowns(): Promise<void> {
    const now = new Date();
    this.cooldowns.forEach((cooldown, id) => {
      if (new Date(cooldown.expiresAt) < now) {
        this.cooldowns.delete(id);
      }
    });
  }
  
  // Leaderboard operations
  async getLeaderboard(serverId?: string): Promise<Leaderboard[]> {
    if (serverId) {
      return Array.from(this.leaderboards.values()).filter(
        (entry) => entry.serverId === serverId
      );
    }
    return Array.from(this.leaderboards.values()).filter(
      (entry) => entry.serverId === null
    );
  }
  
  async updateLeaderboardRanking(userId: number, serverId: string | null, updates: Partial<Leaderboard>): Promise<Leaderboard | undefined> {
    // Find existing entry
    const existingEntry = Array.from(this.leaderboards.values()).find(
      (entry) => entry.userId === userId && entry.serverId === serverId
    );
    
    if (existingEntry) {
      // Update existing entry
      const updatedEntry = { ...existingEntry, ...updates, updatedAt: new Date() };
      this.leaderboards.set(existingEntry.id, updatedEntry);
      return updatedEntry;
    } else {
      // Create new entry
      const id = this.leaderboardIdCounter++;
      const newEntry: Leaderboard = {
        id,
        userId,
        serverId,
        cashRank: updates.cashRank || 0,
        levelRank: updates.levelRank || 0,
        updatedAt: new Date(),
      };
      this.leaderboards.set(id, newEntry);
      return newEntry;
    }
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        cash: 1000,
        level: 0,
        xp: 0,
        wins: 0,
        losses: 0,
        highestWin: 0,
        createdAt: now
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  // Game operations
  async createGame(game: Omit<Game, "id" | "playedAt">): Promise<Game> {
    const now = new Date();
    const [newGame] = await db
      .insert(games)
      .values({
        ...game,
        playedAt: now
      })
      .returning();
    return newGame;
  }
  
  async getGamesByUser(userId: number): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.userId, userId));
  }
  
  async getGamesByType(gameType: string): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.gameType, gameType));
  }
  
  // Cooldown operations
  async getCooldowns(userId: number): Promise<Cooldown[]> {
    return db
      .select()
      .from(cooldowns)
      .where(eq(cooldowns.userId, userId));
  }
  
  async setCooldown(cooldown: Omit<Cooldown, "id">): Promise<Cooldown> {
    const [newCooldown] = await db
      .insert(cooldowns)
      .values(cooldown)
      .returning();
    return newCooldown;
  }
  
  async clearExpiredCooldowns(): Promise<void> {
    const now = new Date();
    await db
      .delete(cooldowns)
      .where(
        sql`${cooldowns.expiresAt} < ${now}`
      );
  }
  
  // Leaderboard operations
  async getLeaderboard(serverId?: string): Promise<Leaderboard[]> {
    if (serverId) {
      return db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.serverId, serverId))
        .orderBy(desc(leaderboard.cashRank), desc(leaderboard.levelRank));
    }
    return db
      .select()
      .from(leaderboard)
      .where(isNull(leaderboard.serverId))
      .orderBy(desc(leaderboard.cashRank), desc(leaderboard.levelRank));
  }
  
  async updateLeaderboardRanking(userId: number, serverId: string | null, updates: Partial<Leaderboard>): Promise<Leaderboard | undefined> {
    // Find existing entry
    const [existingEntry] = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.userId, userId),
          serverId ? eq(leaderboard.serverId, serverId) : isNull(leaderboard.serverId)
        )
      );
    
    if (existingEntry) {
      // Update existing entry
      const [updatedEntry] = await db
        .update(leaderboard)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(leaderboard.id, existingEntry.id))
        .returning();
      return updatedEntry;
    } else {
      // Create new entry
      const [newEntry] = await db
        .insert(leaderboard)
        .values({
          userId,
          serverId,
          cashRank: updates.cashRank || 0,
          levelRank: updates.levelRank || 0,
          updatedAt: new Date()
        })
        .returning();
      return newEntry;
    }
  }
}

// Switch from memory storage to database storage
export const storage = new DatabaseStorage();
