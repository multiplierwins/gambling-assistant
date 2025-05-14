import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { blackjackGameSchema, coinflipGameSchema, crashGameSchema, findTheLadyGameSchema, gambleGameSchema, parseBetAmount, xpForLevel, levelFromXP } from "@shared/schema";
import { insertItemSchema, insertInventorySchema, insertActiveBoostSchema } from "@shared/shopSchema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User-related routes
  app.get("/api/users/me", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate next level XP requirement
      const nextLevelXP = xpForLevel(user.level);
      
      // Include some statistics
      const games = await storage.getGamesByUser(userId);
      const favoriteGame = getFavoriteGame(games);
      
      // Get leaderboard rankings
      const globalRanking = await getGlobalRanking(userId);
      const serverRanking = await getServerRanking(userId, "demo-server");
      
      // Calculate win rate
      const winRate = user.wins + user.losses > 0 
        ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
        : 0;
      
      // Return user profile with additional details
      return res.json({
        id: user.id,
        username: user.username,
        cash: user.cash,
        level: user.level,
        xp: user.xp,
        nextLevelXP,
        wins: user.wins,
        losses: user.losses,
        winRate,
        highestWin: user.highestWin,
        stats: {
          favoriteGame,
          globalRank: globalRanking,
          serverRank: serverRanking,
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Error fetching user profile" });
    }
  });
  
  // Cooldowns
  app.get("/api/cooldowns", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      await storage.clearExpiredCooldowns();
      const cooldowns = await storage.getCooldowns(userId);
      
      // Add fake cooldowns for demo
      const demoCooldowns = [
        {
          type: "daily",
          label: "/daily",
          description: "Get daily cash reward",
          isReady: true,
          timeLeft: 0
        },
        {
          type: "work",
          label: "/work",
          description: "Work for cash",
          isReady: false,
          timeLeft: 272 // 4m 32s in seconds
        },
        {
          type: "vote",
          label: "/vote",
          description: "Vote for rewards",
          isReady: true,
          timeLeft: 0
        }
      ];
      
      return res.json(demoCooldowns);
    } catch (error) {
      console.error("Error fetching cooldowns:", error);
      return res.status(500).json({ message: "Error fetching cooldowns" });
    }
  });
  
  // Economy actions
  app.post("/api/economy/daily", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for existing cooldown
      const cooldowns = await storage.getCooldowns(userId);
      const dailyCooldown = cooldowns.find(c => c.type === "daily");
      
      if (dailyCooldown && new Date(dailyCooldown.expiresAt) > new Date()) {
        return res.status(400).json({ 
          message: "Daily reward not ready yet",
          expiresAt: dailyCooldown.expiresAt
        });
      }
      
      // Calculate reward (base reward * level)
      const reward = 1000 * (user.level + 1);
      
      // Update user cash
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash + reward
      });
      
      // Set cooldown (24 hours)
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      await storage.setCooldown({
        userId,
        type: "daily",
        expiresAt: tomorrow
      });
      
      return res.json({
        success: true,
        reward,
        newBalance: updatedUser?.cash || user.cash + reward
      });
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      return res.status(500).json({ message: "Error claiming daily reward" });
    }
  });
  
  app.post("/api/economy/work", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for existing cooldown
      const cooldowns = await storage.getCooldowns(userId);
      const workCooldown = cooldowns.find(c => c.type === "work");
      
      if (workCooldown && new Date(workCooldown.expiresAt) > new Date()) {
        return res.status(400).json({ 
          message: "Work cooldown not ready yet",
          expiresAt: workCooldown.expiresAt
        });
      }
      
      // Calculate reward (random amount based on level)
      const minReward = 100 * (user.level + 1);
      const maxReward = 500 * (user.level + 1);
      const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
      
      // Update user cash
      const updatedUser = await storage.updateUser(userId, {
        cash: user.cash + reward
      });
      
      // Set cooldown (10 minutes)
      const cooldownExpiry = new Date();
      cooldownExpiry.setMinutes(cooldownExpiry.getMinutes() + 10);
      await storage.setCooldown({
        userId,
        type: "work",
        expiresAt: cooldownExpiry
      });
      
      return res.json({
        success: true,
        reward,
        newBalance: updatedUser?.cash || user.cash + reward
      });
    } catch (error) {
      console.error("Error working for cash:", error);
      return res.status(500).json({ message: "Error working for cash" });
    }
  });
  
  // Games
  app.post("/api/games/blackjack", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const gameInput = blackjackGameSchema.safeParse(req.body);
      if (!gameInput.success) {
        return res.status(400).json({ message: "Invalid game parameters", errors: gameInput.error.format() });
      }
      
      const { bet, mode } = gameInput.data;
      
      // Check if user has enough cash
      if (bet > user.cash) {
        return res.status(400).json({ message: "Not enough cash for this bet" });
      }
      
      // Start a blackjack game with 2 cards for player and 2 for dealer
      const cards = generateDeck();
      const playerCards = [drawCard(cards), drawCard(cards)];
      const dealerCards = [drawCard(cards), drawCard(cards)];
      
      // Check for blackjack
      const playerTotal = calculateHandValue(playerCards);
      const dealerTotal = calculateHandValue(dealerCards);
      let gameState = "playing";
      let winnings = 0;
      
      if (playerTotal === 21) {
        // Player has blackjack
        gameState = "blackjack";
        winnings = Math.floor(bet * (mode === "easy" ? 1.5 : 2));
        
        // Update user stats
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash + winnings,
          wins: user.wins + 1,
          highestWin: Math.max(user.highestWin, winnings)
        });
        
        // Record game
        await storage.createGame({
          userId,
          gameType: "blackjack",
          bet,
          winnings,
          isWin: true
        });
      } else if (dealerTotal === 21) {
        // Dealer has blackjack
        gameState = "dealer_blackjack";
        
        // Update user stats
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash - bet,
          losses: user.losses + 1
        });
        
        // Record game
        await storage.createGame({
          userId,
          gameType: "blackjack",
          bet,
          winnings: 0,
          isWin: false
        });
      } else {
        // Game continues
        // In a real implementation, we would save the game state
        // For now, we'll simulate a random outcome
        const randomOutcome = Math.random() > 0.5;
        if (randomOutcome) {
          // Player wins
          winnings = Math.floor(bet * (mode === "easy" ? 1.5 : 2));
          gameState = "win";
          
          // Update user stats
          const updatedUser = await storage.updateUser(userId, {
            cash: user.cash + winnings - bet,
            wins: user.wins + 1,
            highestWin: Math.max(user.highestWin, winnings - bet)
          });
          
          // Record game
          await storage.createGame({
            userId,
            gameType: "blackjack",
            bet,
            winnings,
            isWin: true
          });
        } else {
          // Player loses
          gameState = "lose";
          
          // Update user stats
          const updatedUser = await storage.updateUser(userId, {
            cash: user.cash - bet,
            losses: user.losses + 1
          });
          
          // Record game
          await storage.createGame({
            userId,
            gameType: "blackjack",
            bet,
            winnings: 0,
            isWin: false
          });
        }
      }
      
      return res.json({
        gameId: Date.now(), // In a real app, this would be a real game ID
        gameType: "blackjack",
        playerCards,
        dealerCards,
        playerTotal: mode === "easy" ? playerTotal : null,
        dealerTotal: mode === "easy" ? dealerTotal : null,
        bet,
        mode,
        gameState,
        winnings
      });
    } catch (error) {
      console.error("Error playing blackjack:", error);
      return res.status(500).json({ message: "Error playing blackjack" });
    }
  });
  
  app.post("/api/games/coinflip", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const gameInput = coinflipGameSchema.safeParse(req.body);
      if (!gameInput.success) {
        return res.status(400).json({ message: "Invalid game parameters", errors: gameInput.error.format() });
      }
      
      const { prediction, bet } = gameInput.data;
      
      // Check if user has enough cash
      if (bet > user.cash) {
        return res.status(400).json({ message: "Not enough cash for this bet" });
      }
      
      // Flip a coin (heads or tails)
      const result = Math.random() > 0.5 ? "heads" : "tails";
      const isWin = result === prediction;
      let winnings = 0;
      
      if (isWin) {
        // Player wins (1:1 odds)
        winnings = bet * 2;
        
        // Update user stats
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash + bet,
          wins: user.wins + 1,
          highestWin: Math.max(user.highestWin, bet)
        });
      } else {
        // Player loses
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash - bet,
          losses: user.losses + 1
        });
      }
      
      // Record game
      await storage.createGame({
        userId,
        gameType: "coinflip",
        bet,
        winnings: isWin ? winnings : 0,
        isWin
      });
      
      return res.json({
        gameId: Date.now(), // In a real app, this would be a real game ID
        gameType: "coinflip",
        prediction,
        result,
        bet,
        isWin,
        winnings: isWin ? winnings : 0
      });
    } catch (error) {
      console.error("Error playing coinflip:", error);
      return res.status(500).json({ message: "Error playing coinflip" });
    }
  });
  
  app.post("/api/games/crash", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const gameInput = crashGameSchema.safeParse(req.body);
      if (!gameInput.success) {
        return res.status(400).json({ message: "Invalid game parameters", errors: gameInput.error.format() });
      }
      
      const { bet, mode } = gameInput.data;
      
      // Check if user has enough cash
      if (bet > user.cash) {
        return res.status(400).json({ message: "Not enough cash for this bet" });
      }
      
      // Calculate crash point (random with 10% chance to crash each step)
      let multiplier = 1.0;
      while (Math.random() > 0.1) {
        multiplier += mode === "easy" ? 0.1 : 0.2;
        multiplier = Math.round(multiplier * 100) / 100; // Round to 2 decimal places
      }
      
      // Simulate player cashing out at random point before crash
      const cashoutMultiplier = Math.min(multiplier * Math.random(), multiplier);
      const playerCashedOut = cashoutMultiplier < multiplier;
      
      let winnings = 0;
      let isWin = false;
      
      if (playerCashedOut) {
        // Player cashed out before crash
        winnings = Math.floor(bet * cashoutMultiplier);
        isWin = true;
        
        // Update user stats
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash + winnings - bet,
          wins: user.wins + 1,
          highestWin: Math.max(user.highestWin, winnings - bet)
        });
      } else {
        // Player didn't cash out in time
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash - bet,
          losses: user.losses + 1
        });
      }
      
      // Record game
      await storage.createGame({
        userId,
        gameType: "crash",
        bet,
        winnings: isWin ? winnings : 0,
        isWin
      });
      
      return res.json({
        gameId: Date.now(), // In a real app, this would be a real game ID
        gameType: "crash",
        bet,
        mode,
        crashPoint: multiplier,
        cashoutPoint: playerCashedOut ? cashoutMultiplier : null,
        isWin,
        winnings
      });
    } catch (error) {
      console.error("Error playing crash:", error);
      return res.status(500).json({ message: "Error playing crash" });
    }
  });
  
  app.post("/api/games/findthelady", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const gameInput = findTheLadyGameSchema.safeParse(req.body);
      if (!gameInput.success) {
        return res.status(400).json({ message: "Invalid game parameters", errors: gameInput.error.format() });
      }
      
      const { bet, mode } = gameInput.data;
      
      // Check if user has enough cash
      if (bet > user.cash) {
        return res.status(400).json({ message: "Not enough cash for this bet" });
      }
      
      // Set up game (lady and kings)
      const numCards = mode === "easy" ? 3 : 5;
      const ladyPosition = Math.floor(Math.random() * numCards);
      
      // Simulate player picking a card
      const playerPick = Math.floor(Math.random() * numCards);
      const isWin = playerPick === ladyPosition;
      
      let winnings = 0;
      
      if (isWin) {
        // Player found the lady
        winnings = bet * (mode === "easy" ? 3 : 5);
        
        // Update user stats
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash + winnings - bet,
          wins: user.wins + 1,
          highestWin: Math.max(user.highestWin, winnings - bet)
        });
      } else {
        // Player picked a king
        const updatedUser = await storage.updateUser(userId, {
          cash: user.cash - bet,
          losses: user.losses + 1
        });
      }
      
      // Record game
      await storage.createGame({
        userId,
        gameType: "findthelady",
        bet,
        winnings: isWin ? winnings : 0,
        isWin
      });
      
      return res.json({
        gameId: Date.now(), // In a real app, this would be a real game ID
        gameType: "findthelady",
        bet,
        mode,
        ladyPosition,
        playerPick,
        isWin,
        winnings
      });
    } catch (error) {
      console.error("Error playing find the lady:", error);
      return res.status(500).json({ message: "Error playing find the lady" });
    }
  });
  
  app.post("/api/games/slotmachine", async (req: Request, res: Response) => {
    try {
      const { bet, lines = 1 } = req.body;
      
      if (!bet) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Get user ID from session
      const userId = 1; // Mock user ID (in a real app, this would come from the session)
      
      // Get user from storage
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough cash
      if (user.cash < bet * lines) {
        return res.status(400).json({ message: "Not enough cash" });
      }
      
      // Define symbols and their payouts
      const symbols = [
        { id: "bar", name: "Bar", payout: 10 },
        { id: "bell", name: "Bell", payout: 8 },
        { id: "cherry", name: "Cherry", payout: 5 },
        { id: "diamond", name: "Diamond", payout: 12 },
        { id: "heart", name: "Heart", payout: 6 },
        { id: "lemon", name: "Lemon", payout: 3 },
        { id: "melon", name: "Melon", payout: 4 },
        { id: "seven", name: "Seven", payout: 15 },
        { id: "shoe", name: "Shoe", payout: 7 }
      ];
      
      // Generate a 3x5 slot grid (3 rows, 5 columns)
      const grid = Array(3).fill(0).map(() => 
        Array(5).fill(0).map(() => 
          symbols[Math.floor(Math.random() * symbols.length)]
        )
      );
      
      // Check for winning combinations
      // For this example, we'll check for horizontal lines only
      // The number of lines bet determines how many rows we check
      let totalWinnings = 0;
      const winningLines: { line: number, symbols: string[], multiplier: number }[] = [];
      
      // Generate line patterns (horizontal, diagonal, etc.)
      const linePatterns = [
        [0, 0, 0, 0, 0], // Top row
        [1, 1, 1, 1, 1], // Middle row
        [2, 2, 2, 2, 2], // Bottom row
        [0, 1, 2, 1, 0], // V shape
        [2, 1, 0, 1, 2]  // Inverted V shape
      ];
      
      // Check only the number of lines that were bet on
      for (let l = 0; l < Math.min(lines, linePatterns.length); l++) {
        const pattern = linePatterns[l];
        const lineSymbols = pattern.map((row, col) => grid[row][col]);
        
        // Check if we have 3 or more in a row of the same symbol
        let currentSymbol = lineSymbols[0].id;
        let count = 1;
        let maxCount = 1;
        let winSymbol = currentSymbol;
        
        for (let i = 1; i < lineSymbols.length; i++) {
          if (lineSymbols[i].id === currentSymbol) {
            count++;
            if (count > maxCount) {
              maxCount = count;
              winSymbol = currentSymbol;
            }
          } else {
            currentSymbol = lineSymbols[i].id;
            count = 1;
          }
        }
        
        // 3 or more symbols in a row wins
        if (maxCount >= 3) {
          const winningSymbol = symbols.find(s => s.id === winSymbol);
          if (winningSymbol) {
            // Payouts increase with the number of symbols matched
            const multiplier = winningSymbol.payout * (maxCount - 2);
            const lineWinnings = bet * multiplier;
            totalWinnings += lineWinnings;
            
            winningLines.push({
              line: l + 1,
              symbols: Array(maxCount).fill(winSymbol),
              multiplier
            });
          }
        }
      }
      
      const isWin = totalWinnings > 0;
      
      // Update user's cash
      await storage.updateUser(userId, {
        cash: isWin ? user.cash + totalWinnings - (bet * lines) : user.cash - (bet * lines),
        wins: isWin ? user.wins + 1 : user.wins,
        losses: isWin ? user.losses : user.losses + 1,
        highestWin: isWin ? Math.max(user.highestWin, totalWinnings) : user.highestWin
      });
      
      // Record game
      await storage.createGame({
        userId,
        gameType: "slotmachine",
        bet: bet * lines,
        winnings: totalWinnings,
        isWin
      });
      
      return res.json({
        gameId: Date.now(),
        gameType: "slotmachine",
        bet,
        lines,
        grid,
        winningLines,
        totalWinnings,
        isWin
      });
    } catch (error) {
      console.error("Error playing slot machine:", error);
      return res.status(500).json({ message: "Error playing slot machine" });
    }
  });

  app.post("/api/games/connectfour", (req: Request, res: Response) => {
    // In a real implementation, this would set up a multiplayer game
    // For now, we'll just return a game ID
    res.json({
      gameId: Date.now(),
      gameType: "connectfour",
      message: "Game created, waiting for another player"
    });
  });
  
  app.post("/api/games/gamble", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, this would come from auth
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const gameInput = gambleGameSchema.safeParse(req.body);
      if (!gameInput.success) {
        return res.status(400).json({ message: "Invalid game parameters", errors: gameInput.error.format() });
      }
      
      const { bet, mode } = gameInput.data;
      
      // Check if user has enough cash
      if (bet > user.cash) {
        return res.status(400).json({ message: "Not enough cash for this bet" });
      }
      
      // Choose a random game
      const games = ["blackjack", "coinflip", "crash", "findthelady"];
      const randomGame = games[Math.floor(Math.random() * games.length)];
      
      // Redirect to that game's endpoint (in a real app)
      // For now, we'll just return which game was chosen
      return res.json({
        gameId: Date.now(),
        gameType: "gamble",
        chosenGame: randomGame,
        bet,
        mode,
        message: `Playing ${randomGame} with ${bet} bet in ${mode} mode`
      });
    } catch (error) {
      console.error("Error playing random game:", error);
      return res.status(500).json({ message: "Error playing random game" });
    }
  });
  
  // Leaderboard
  app.get("/api/leaderboard/cash", async (req: Request, res: Response) => {
    try {
      const serverId = req.query.server === "true" ? "demo-server" : undefined;
      
      // Get users sorted by cash
      const users = await storage.getAllUsers();
      const sortedUsers = users.sort((a, b) => b.cash - a.cash);
      
      // Build leaderboard entries
      const leaderboard = sortedUsers.slice(0, 10).map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        level: user.level,
        value: user.cash,
        isCurrentUser: user.id === 1
      }));
      
      // Add current user if not in top 10
      const currentUser = users.find(u => u.id === 1);
      if (currentUser && !leaderboard.some(entry => entry.userId === 1)) {
        const userRank = sortedUsers.findIndex(u => u.id === 1) + 1;
        leaderboard.push({
          rank: userRank,
          userId: currentUser.id,
          username: currentUser.username,
          level: currentUser.level,
          value: currentUser.cash,
          isCurrentUser: true
        });
      }
      
      return res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching cash leaderboard:", error);
      return res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });
  
  app.get("/api/leaderboard/level", async (req: Request, res: Response) => {
    try {
      const serverId = req.query.server === "true" ? "demo-server" : undefined;
      
      // Get users sorted by level
      const users = await storage.getAllUsers();
      const sortedUsers = users.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      });
      
      // Build leaderboard entries
      const leaderboard = sortedUsers.slice(0, 10).map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        cash: user.cash,
        value: user.level,
        isCurrentUser: user.id === 1
      }));
      
      // Add current user if not in top 10
      const currentUser = users.find(u => u.id === 1);
      if (currentUser && !leaderboard.some(entry => entry.userId === 1)) {
        const userRank = sortedUsers.findIndex(u => u.id === 1) + 1;
        leaderboard.push({
          rank: userRank,
          userId: currentUser.id,
          username: currentUser.username,
          cash: currentUser.cash,
          value: currentUser.level,
          isCurrentUser: true
        });
      }
      
      return res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching level leaderboard:", error);
      return res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });
  
  // Commands/Help
  app.get("/api/commands", async (req: Request, res: Response) => {
    const searchQuery = req.query.search as string || "";
    const category = req.query.category as string || "all";
    
    // Define commands
    const commands = [
      {
        name: "/blackjack [bet] [mode]",
        description: "Play a game of Blackjack (21). Try to get cards totaling 21 without going over.",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          modes: [
            { name: "Easy", description: "Odds: 3:2. Your current count is shown with both possible values when you have an Ace." },
            { name: "Hard", description: "Odds: 2:1. No totals are shown, you must add the values yourself." }
          ],
          examples: [
            "/blackjack 1000",
            "/blackjack 1k hard",
            "@Piglet Gambling Bot bj 1k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot blackjack",
            "@Piglet Gambling Bot bj"
          ]
        }
      },
      {
        name: "/coinflip [prediction] [bet]",
        description: "Flip a coin and guess heads or tails to win your bet.",
        category: "games",
        details: {
          options: [
            { name: "prediction", description: "Choose whether you think the coin will be heads or tails", required: true },
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true }
          ],
          odds: "1:1",
          examples: [
            "/coinflip heads 1000",
            "/coinflip tails 1k",
            "@Piglet Gambling Bot cf h 1k"
          ],
          alternatives: [
            "@Piglet Gambling Bot coinflip",
            "@Piglet Gambling Bot cf"
          ]
        }
      },
      {
        name: "/crash [bet] [mode]",
        description: "Multiplier increases until it crashes. Cash out before it's too late!",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          examples: [
            "/crash 1000",
            "/crash 1k hard",
            "@Piglet Gambling Bot cr 5k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot crash",
            "@Piglet Gambling Bot cr"
          ]
        }
      },
      {
        name: "/findthelady [bet] [mode]",
        description: "Find the Queen among the Kings after the shuffle.",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          modes: [
            { name: "Easy", description: "3 cards. Odds: 1:3." },
            { name: "Hard", description: "5 cards. Odds: 1:5." }
          ],
          examples: [
            "/findthelady 1000",
            "/findthelady 1k hard",
            "@Piglet Gambling Bot ftl 1k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot findthelady",
            "@Piglet Gambling Bot ftl"
          ]
        }
      },
      {
        name: "/connectfour",
        description: "Play a game of Connect Four with a friend. Get 4 in a row to win!",
        category: "games",
        details: {
          type: "Multiplayer",
          examples: [
            "/connectfour",
            "@Piglet Gambling Bot c4"
          ],
          alternatives: [
            "@Piglet Gambling Bot connectfour",
            "@Piglet Gambling Bot c4",
            "@Piglet Gambling Bot connect4"
          ]
        }
      },
      {
        name: "/gamble [bet] [mode]",
        description: "For the indecisive gambler - play one of the games in the bot, chosen at random!",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          examples: [
            "/gamble 1000",
            "/gamble 1k hard",
            "@Piglet Gambling Bot g 1k"
          ],
          alternatives: [
            "@Piglet Gambling Bot gamble",
            "@Piglet Gambling Bot g",
            "@Piglet Gambling Bot play"
          ]
        }
      },
      {
        name: "/daily",
        description: "Claim your daily cash reward.",
        category: "economy",
        details: {
          cooldown: "24 hours (resets at midnight)",
          reward: "1,000 × your level",
          examples: [
            "/daily",
            "@Piglet Gambling Bot daily"
          ]
        }
      },
      {
        name: "/work",
        description: "Work to earn some cash.",
        category: "economy",
        details: {
          cooldown: "10 minutes",
          reward: "Random amount based on your level",
          examples: [
            "/work",
            "@Piglet Gambling Bot work"
          ]
        }
      },
      {
        name: "/profile",
        description: "View your profile statistics.",
        category: "profile",
        details: {
          examples: [
            "/profile",
            "@Piglet Gambling Bot profile",
            "@Piglet Gambling Bot p"
          ],
          alternatives: [
            "@Piglet Gambling Bot p",
            "@Piglet Gambling Bot me"
          ]
        }
      },
      {
        name: "/leaderboard",
        description: "View the server or global leaderboards.",
        category: "profile",
        details: {
          options: [
            { name: "type", description: "Type of leaderboard (cash, level)", required: true },
            { name: "scope", description: "Server or global leaderboard", required: false }
          ],
          examples: [
            "/leaderboard cash",
            "/leaderboard level g",
            "@Piglet Gambling Bot lb cash"
          ],
          alternatives: [
            "@Piglet Gambling Bot leaderboard",
            "@Piglet Gambling Bot lb"
          ]
        }
      },
      {
        name: "/help",
        description: "Get help with commands.",
        category: "other",
        details: {
          options: [
            { name: "command", description: "Get help for a specific command", required: false }
          ],
          examples: [
            "/help",
            "/help blackjack",
            "@Piglet Gambling Bot help daily"
          ]
        }
      }
    ];
    
    // Filter commands by search and category
    let filteredCommands = commands;
    
    if (searchQuery) {
      filteredCommands = filteredCommands.filter(command => 
        command.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        command.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (category !== "all") {
      filteredCommands = filteredCommands.filter(command => 
        command.category === category
      );
    }
    
    return res.json(filteredCommands);
  });
  
  app.get("/api/commands/:name", async (req: Request, res: Response) => {
    const commandName = req.params.name;
    
    // Define commands (same as above)
    const commands = [
      {
        name: "/blackjack",
        fullName: "/blackjack [bet] [mode]",
        description: "Play a game of Blackjack (21). Try to get cards totaling 21 without going over.",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          modes: [
            { name: "Easy", description: "Odds: 3:2. Your current count is shown with both possible values when you have an Ace." },
            { name: "Hard", description: "Odds: 2:1. No totals are shown, you must add the values yourself." }
          ],
          examples: [
            "/blackjack 1000",
            "/blackjack 1k hard",
            "@Piglet Gambling Bot bj 1k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot blackjack",
            "@Piglet Gambling Bot bj"
          ]
        }
      },
      {
        name: "/coinflip",
        fullName: "/coinflip [prediction] [bet]",
        description: "Flip a coin and guess heads or tails to win your bet.",
        category: "games",
        details: {
          options: [
            { name: "prediction", description: "Choose whether you think the coin will be heads or tails", required: true },
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true }
          ],
          odds: "1:1",
          examples: [
            "/coinflip heads 1000",
            "/coinflip tails 1k",
            "@Piglet Gambling Bot cf h 1k"
          ],
          alternatives: [
            "@Piglet Gambling Bot coinflip",
            "@Piglet Gambling Bot cf"
          ]
        }
      },
      {
        name: "/crash",
        fullName: "/crash [bet] [mode]",
        description: "Multiplier increases until it crashes. Cash out before it's too late!",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          examples: [
            "/crash 1000",
            "/crash 1k hard",
            "@Piglet Gambling Bot cr 5k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot crash",
            "@Piglet Gambling Bot cr"
          ]
        }
      },
      {
        name: "/findthelady",
        fullName: "/findthelady [bet] [mode]",
        description: "Find the Queen among the Kings after the shuffle.",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          modes: [
            { name: "Easy", description: "3 cards. Odds: 1:3." },
            { name: "Hard", description: "5 cards. Odds: 1:5." }
          ],
          examples: [
            "/findthelady 1000",
            "/findthelady 1k hard",
            "@Piglet Gambling Bot ftl 1k h"
          ],
          alternatives: [
            "@Piglet Gambling Bot findthelady",
            "@Piglet Gambling Bot ftl"
          ]
        }
      },
      {
        name: "/connectfour",
        fullName: "/connectfour",
        description: "Play a game of Connect Four with a friend. Get 4 in a row to win!",
        category: "games",
        details: {
          type: "Multiplayer",
          examples: [
            "/connectfour",
            "@Piglet Gambling Bot c4"
          ],
          alternatives: [
            "@Piglet Gambling Bot connectfour",
            "@Piglet Gambling Bot c4",
            "@Piglet Gambling Bot connect4"
          ]
        }
      },
      {
        name: "/gamble",
        fullName: "/gamble [bet] [mode]",
        description: "For the indecisive gambler - play one of the games in the bot, chosen at random!",
        category: "games",
        details: {
          options: [
            { name: "bet", description: "The amount to bet. Use 'm' for max and 'a' for all in.", required: true },
            { name: "mode", description: "Toggle hard mode (default: Easy Mode)", required: false }
          ],
          examples: [
            "/gamble 1000",
            "/gamble 1k hard",
            "@Piglet Gambling Bot g 1k"
          ],
          alternatives: [
            "@Piglet Gambling Bot gamble",
            "@Piglet Gambling Bot g",
            "@Piglet Gambling Bot play"
          ]
        }
      }
    ];
    
    // Find command by name
    const command = commands.find(cmd => 
      cmd.name === commandName || 
      cmd.name === `/${commandName}`
    );
    
    if (!command) {
      return res.status(404).json({ message: "Command not found" });
    }
    
    return res.json(command);
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function getFavoriteGame(games: any[]): string {
  if (!games || games.length === 0) return "None";
  
  // Count frequency of each game type
  const gameCounts: Record<string, number> = {};
  games.forEach(game => {
    gameCounts[game.gameType] = (gameCounts[game.gameType] || 0) + 1;
  });
  
  // Find the most frequent game
  let favoriteGame = "None";
  let maxCount = 0;
  
  Object.entries(gameCounts).forEach(([game, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteGame = game;
    }
  });
  
  // Capitalize first letter
  return favoriteGame.charAt(0).toUpperCase() + favoriteGame.slice(1);
}

async function getGlobalRanking(userId: number): Promise<number> {
  // In a real app, this would calculate the user's global ranking
  // For demo purposes, return a fixed value
  return 342;
}

async function getServerRanking(userId: number, serverId: string): Promise<number> {
  // In a real app, this would calculate the user's server ranking
  // For demo purposes, return a fixed value
  return 5;
}

// Helper functions for Blackjack game
function generateDeck() {
  const suits = ['♥', '♦', '♣', '♠'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck = [];
  
  // Create 6 decks for blackjack
  for (let d = 0; d < 6; d++) {
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }
  }
  
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function drawCard(deck: any[]) {
  return deck.pop();
}

function calculateHandValue(cards: any[]) {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.value === 'A') {
      aces++;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}
