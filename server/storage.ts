import { users, games, cooldowns, leaderboard, type User, type InsertUser, type Game, type Cooldown, type Leaderboard } from "@shared/schema";

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

export const storage = new MemStorage();
