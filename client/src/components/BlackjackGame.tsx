import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BlackjackGameProps {
  onClose: () => void;
}

type Card = {
  value: string;
  suit: string;
};

export default function BlackjackGame({ onClose }: BlackjackGameProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(5000);
  const [gameState, setGameState] = useState<"initial" | "playing" | "end">("initial");
  const [mode, setMode] = useState<"easy" | "hard">("easy");
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [winnings, setWinnings] = useState(0);
  
  const { mutate: startGame, isPending: isStarting } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games/blackjack", {
        bet,
        mode
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGameState("playing");
      setDealerCards(data.dealerCards);
      setPlayerCards(data.playerCards);
      setDealerTotal(data.dealerTotal);
      setPlayerTotal(data.playerTotal);
      
      // Check for instant win/loss
      if (data.gameState === "blackjack") {
        setResult("Blackjack! You win!");
        setWinnings(data.winnings);
        setGameState("end");
        
        // Refresh user data to update cash
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      } else if (data.gameState === "dealer_blackjack") {
        setResult("Dealer has Blackjack! You lose.");
        setGameState("end");
        
        // Refresh user data to update cash
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start game: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const { mutate: hitCard } = useMutation({
    mutationFn: async () => {
      // In a real game, this would call an API to draw a card
      // For now, we'll simulate drawing a card and checking for bust
      const newCard = { 
        value: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][Math.floor(Math.random() * 13)],
        suit: ["♥", "♦", "♣", "♠"][Math.floor(Math.random() * 4)]
      };
      
      const newCards = [...playerCards, newCard];
      setPlayerCards(newCards);
      
      // Calculate new total
      const newTotal = calculateHandValue(newCards);
      setPlayerTotal(newTotal);
      
      if (newTotal > 21) {
        // Player busts
        setResult("Bust! You lose.");
        setGameState("end");
        return { busted: true };
      }
      
      return { busted: false };
    },
    onSuccess: (data) => {
      if (data.busted) {
        // Refresh user data to update cash
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to hit: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const { mutate: stand } = useMutation({
    mutationFn: async () => {
      // In a real game, this would call an API to complete the dealer's hand
      // For now, we'll simulate dealer drawing cards until 17 or higher
      let currentDealerCards = [...dealerCards];
      let currentDealerTotal = calculateHandValue(currentDealerCards);
      
      while (currentDealerTotal < 17) {
        const newCard = { 
          value: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][Math.floor(Math.random() * 13)],
          suit: ["♥", "♦", "♣", "♠"][Math.floor(Math.random() * 4)]
        };
        
        currentDealerCards.push(newCard);
        currentDealerTotal = calculateHandValue(currentDealerCards);
      }
      
      setDealerCards(currentDealerCards);
      setDealerTotal(currentDealerTotal);
      
      // Determine winner
      const currentPlayerTotal = calculateHandValue(playerCards);
      
      if (currentDealerTotal > 21) {
        // Dealer busts
        setResult("Dealer busts! You win!");
        const win = bet * (mode === "easy" ? 1.5 : 2);
        setWinnings(win);
        return { playerWins: true, winnings: win };
      } else if (currentDealerTotal > currentPlayerTotal) {
        // Dealer wins
        setResult("Dealer wins!");
        return { playerWins: false, winnings: 0 };
      } else if (currentDealerTotal < currentPlayerTotal) {
        // Player wins
        setResult("You win!");
        const win = bet * (mode === "easy" ? 1.5 : 2);
        setWinnings(win);
        return { playerWins: true, winnings: win };
      } else {
        // Push (tie)
        setResult("Push! Bet returned.");
        setWinnings(bet);
        return { playerWins: "tie", winnings: bet };
      }
    },
    onSuccess: () => {
      setGameState("end");
      // Refresh user data to update cash
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to stand: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const { mutate: doubleDown } = useMutation({
    mutationFn: async () => {
      // In a real game, this would call an API to double down
      // For now, we'll simulate doubling the bet, drawing one card, and then standing
      setBet(bet * 2);
      
      // Draw one card
      const newCard = { 
        value: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][Math.floor(Math.random() * 13)],
        suit: ["♥", "♦", "♣", "♠"][Math.floor(Math.random() * 4)]
      };
      
      const newCards = [...playerCards, newCard];
      setPlayerCards(newCards);
      
      // Calculate new total
      const newTotal = calculateHandValue(newCards);
      setPlayerTotal(newTotal);
      
      if (newTotal > 21) {
        // Player busts
        setResult("Bust! You lose.");
        return { busted: true };
      }
      
      // Continue with dealer's turn (same as stand)
      let currentDealerCards = [...dealerCards];
      let currentDealerTotal = calculateHandValue(currentDealerCards);
      
      while (currentDealerTotal < 17) {
        const newCard = { 
          value: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][Math.floor(Math.random() * 13)],
          suit: ["♥", "♦", "♣", "♠"][Math.floor(Math.random() * 4)]
        };
        
        currentDealerCards.push(newCard);
        currentDealerTotal = calculateHandValue(currentDealerCards);
      }
      
      setDealerCards(currentDealerCards);
      setDealerTotal(currentDealerTotal);
      
      // Determine winner
      if (currentDealerTotal > 21) {
        // Dealer busts
        setResult("Dealer busts! You win!");
        const win = bet * (mode === "easy" ? 1.5 : 2);
        setWinnings(win);
        return { playerWins: true, winnings: win };
      } else if (currentDealerTotal > newTotal) {
        // Dealer wins
        setResult("Dealer wins!");
        return { playerWins: false, winnings: 0 };
      } else if (currentDealerTotal < newTotal) {
        // Player wins
        setResult("You win!");
        const win = bet * (mode === "easy" ? 1.5 : 2);
        setWinnings(win);
        return { playerWins: true, winnings: win };
      } else {
        // Push (tie)
        setResult("Push! Bet returned.");
        setWinnings(bet);
        return { playerWins: "tie", winnings: bet };
      }
    },
    onSuccess: () => {
      setGameState("end");
      // Refresh user data to update cash
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to double down: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const calculateHandValue = (cards: Card[]) => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.value === "A") {
        aces++;
        value += 11;
      } else if (["K", "Q", "J"].includes(card.value)) {
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
  };
  
  const renderCardValue = (card: Card) => {
    return (
      <div className="w-24 h-36 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300">
        <span className="text-4xl">{card.value}{card.suit}</span>
      </div>
    );
  };
  
  const handleIncreaseBet = () => {
    setBet(prev => Math.min(prev + 1000, 100000));
  };
  
  const handleDecreaseBet = () => {
    setBet(prev => Math.max(prev - 1000, 1000));
  };
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-playing-card mr-2 text-blue-500"></i>
              Blackjack Game
            </h2>
            
            <div className="flex items-center">
              <div className="bg-[#36393F] rounded-lg px-3 py-1 flex items-center mr-3">
                <i className="fas fa-coins text-yellow-400 mr-1"></i>
                <span className="font-medium">{bet.toLocaleString()}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times-circle text-xl"></i>
              </Button>
            </div>
          </div>
          
          {gameState === "initial" ? (
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-semibold">Place your bet:</h3>
                
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={handleDecreaseBet}>
                    <i className="fas fa-minus"></i>
                  </Button>
                  
                  <div className="bg-[#36393F] rounded-lg px-4 py-2 flex items-center">
                    <i className="fas fa-coins text-yellow-400 mr-2"></i>
                    <span className="font-medium">{bet.toLocaleString()}</span>
                  </div>
                  
                  <Button variant="outline" onClick={handleIncreaseBet}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-semibold">Select mode:</h3>
                
                <div className="flex space-x-4">
                  <Button
                    variant={mode === "easy" ? "default" : "outline"}
                    onClick={() => setMode("easy")}
                  >
                    Easy Mode (3:2)
                  </Button>
                  
                  <Button
                    variant={mode === "hard" ? "default" : "outline"}
                    onClick={() => setMode("hard")}
                  >
                    Hard Mode (2:1)
                  </Button>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full py-6 text-lg"
                  onClick={() => startGame()}
                  disabled={isStarting}
                >
                  {isStarting ? "Dealing cards..." : "Deal Cards"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Dealer's Hand */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-[#B9BBBE]">Dealer's Hand</span>
                  {mode === "easy" && (
                    <span className="ml-2 text-sm bg-[#36393F] rounded px-2 py-0.5">
                      {dealerTotal}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {dealerCards.map((card, index) => (
                    <div key={index}>
                      {renderCardValue(card)}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Player's Hand */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-[#B9BBBE]">Your Hand</span>
                  {mode === "easy" && (
                    <span className="ml-2 text-sm bg-[#36393F] rounded px-2 py-0.5">
                      {playerTotal}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {playerCards.map((card, index) => (
                    <div key={index}>
                      {renderCardValue(card)}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Game Actions */}
              {gameState === "playing" ? (
                <div className="flex space-x-3 pt-4">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                    onClick={() => hitCard()}
                  >
                    Hit
                  </Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                    onClick={() => stand()}
                  >
                    Stand
                  </Button>
                  <Button 
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white"
                    onClick={() => doubleDown()}
                    disabled={playerCards.length > 2}
                  >
                    Double Down
                  </Button>
                </div>
              ) : (
                <div className="pt-4 space-y-4">
                  <div className="bg-[#36393F] rounded-lg p-4 text-center">
                    <h3 className="text-xl font-semibold mb-2">{result}</h3>
                    {winnings > 0 && (
                      <p className="text-green-500 flex items-center justify-center">
                        <i className="fas fa-coins text-yellow-400 mr-2"></i>
                        +{winnings.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full py-4"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
