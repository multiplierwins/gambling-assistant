import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FindTheLadyGameProps {
  onClose: () => void;
}

type CardType = {
  value: string;
  suit: string;
  flipped: boolean;
  isSelected: boolean;
};

export default function FindTheLadyGame({ onClose }: FindTheLadyGameProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(5000);
  const [mode, setMode] = useState<"easy" | "hard">("easy");
  const [gameState, setGameState] = useState<"initial" | "shuffling" | "selecting" | "result">("initial");
  const [cards, setCards] = useState<CardType[]>([]);
  const [ladyPosition, setLadyPosition] = useState<number>(-1);
  const [selectedCard, setSelectedCard] = useState<number>(-1);
  const [isWin, setIsWin] = useState(false);
  const [winnings, setWinnings] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  
  const numCards = mode === "easy" ? 3 : 5;
  
  const { mutate: startGame, isPending: isStarting } = useMutation({
    mutationFn: async () => {
      // Initialize cards
      const newCards: CardType[] = [];
      const randomPosition = Math.floor(Math.random() * numCards);
      
      for (let i = 0; i < numCards; i++) {
        newCards.push({
          value: i === randomPosition ? "Q" : "K",
          suit: i === randomPosition ? "♥" : ["♠", "♣"][Math.floor(Math.random() * 2)],
          flipped: false,
          isSelected: false
        });
      }
      
      setLadyPosition(randomPosition);
      setCards(newCards);
      
      // Show cards briefly
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setCards(cards => cards.map(card => ({ ...card, flipped: true })));
          resolve();
        }, 1000);
      });
    },
    onSuccess: () => {
      setGameState("shuffling");
      
      // Start shuffling animation
      setIsShuffling(true);
      setTimeout(() => {
        setIsShuffling(false);
        setGameState("selecting");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start game: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const { mutate: selectCard } = useMutation({
    mutationFn: async (index: number) => {
      setSelectedCard(index);
      
      // Flip all cards
      setCards(cards => cards.map((card, i) => ({
        ...card,
        flipped: false,
        isSelected: i === index
      })));
      
      // Calculate result
      const playerWin = index === ladyPosition;
      setIsWin(playerWin);
      
      if (playerWin) {
        const win = bet * (mode === "easy" ? 3 : 5);
        setWinnings(win);
      }
      
      // Call API to record result
      const response = await apiRequest("POST", "/api/games/findthelady", {
        bet,
        mode
      });
      return response.json();
    },
    onSuccess: () => {
      setGameState("result");
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to select card: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleIncreaseBet = () => {
    setBet(prev => Math.min(prev + 1000, 100000));
  };
  
  const handleDecreaseBet = () => {
    setBet(prev => Math.max(prev - 1000, 1000));
  };
  
  const renderCard = (card: CardType, index: number) => {
    return (
      <div 
        key={index}
        className={`${
          isShuffling ? 'animate-pulse' : ''
        } transform ${
          card.isSelected ? 'scale-110' : 'hover:scale-105'
        } transition-all duration-300 cursor-pointer`}
        onClick={() => {
          if (gameState === "selecting") {
            selectCard(index);
          }
        }}
      >
        <div className="w-24 h-36 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300">
          {card.flipped ? (
            <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-question text-2xl"></i>
            </div>
          ) : (
            <span className={`text-4xl ${
              card.value === "Q" && card.suit === "♥" ? "text-red-600" : "text-black"
            }`}>
              {card.value}{card.suit}
            </span>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-crown mr-2 text-purple-500"></i>
              Find The Lady
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
                disabled={gameState !== "initial" && gameState !== "result"}
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
                    Easy Mode (3 cards)
                  </Button>
                  
                  <Button
                    variant={mode === "hard" ? "default" : "outline"}
                    onClick={() => setMode("hard")}
                  >
                    Hard Mode (5 cards)
                  </Button>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full py-6 text-lg"
                  onClick={() => startGame()}
                  disabled={isStarting}
                >
                  {isStarting ? "Starting game..." : "Start Game"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Instructions */}
              <div className="text-center">
                {gameState === "shuffling" && (
                  <p className="text-lg font-medium">Shuffling the cards...</p>
                )}
                {gameState === "selecting" && (
                  <p className="text-lg font-medium">Find the Queen of Hearts!</p>
                )}
                {gameState === "result" && isWin && (
                  <p className="text-lg font-medium text-green-500">
                    You found the Queen! You win!
                  </p>
                )}
                {gameState === "result" && !isWin && (
                  <p className="text-lg font-medium text-red-500">
                    Sorry, that's not the Queen. You lose!
                  </p>
                )}
              </div>
              
              {/* Cards Display */}
              <div className="flex justify-center space-x-4 py-6">
                {cards.map((card, index) => renderCard(card, index))}
              </div>
              
              {/* Game Actions */}
              {gameState === "result" && (
                <div className="pt-4 space-y-4">
                  {isWin ? (
                    <div className="bg-[#36393F] rounded-lg p-4 text-center">
                      <h3 className="text-xl font-semibold mb-2 text-green-500">
                        You found the Queen!
                      </h3>
                      <p className="text-green-500 flex items-center justify-center">
                        <i className="fas fa-coins text-yellow-400 mr-2"></i>
                        +{winnings.toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#36393F] rounded-lg p-4 text-center">
                      <h3 className="text-xl font-semibold mb-2 text-red-500">
                        Wrong card! The Queen was {ladyPosition + 1}
                      </h3>
                      <p className="text-red-500">
                        You lost your bet of {bet.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <Button 
                      className="flex-1 py-4"
                      variant="outline"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                    
                    <Button 
                      className="flex-1 py-4"
                      onClick={() => {
                        setGameState("initial");
                        setCards([]);
                        setSelectedCard(-1);
                        setLadyPosition(-1);
                      }}
                    >
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
