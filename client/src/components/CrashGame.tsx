import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

interface CrashGameProps {
  onClose: () => void;
}

export default function CrashGame({ onClose }: CrashGameProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(5000);
  const [mode, setMode] = useState<"easy" | "hard">("easy");
  const [gameState, setGameState] = useState<"initial" | "playing" | "crashed" | "cashed_out">("initial");
  const [multiplier, setMultiplier] = useState(1.0);
  const [cashoutPoint, setCashoutPoint] = useState<number | null>(null);
  const [winnings, setWinnings] = useState(0);
  const [gameId, setGameId] = useState<number | null>(null);
  const [maxMultiplier, setMaxMultiplier] = useState(0);
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number | null>(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    };
  }, []);
  
  const { mutate: startGame, isPending: isStarting } = useMutation({
    mutationFn: async () => {
      // Start the crash game
      const response = await apiRequest("POST", "/api/games/crash", {
        bet,
        mode
      });
      return response.json();
    },
    onSuccess: (data) => {
      // In a real app, we might use WebSockets for real-time updates
      // For this demo, we'll simulate the game locally
      setGameId(data.gameId);
      setMaxMultiplier(data.crashPoint);
      setGameState("playing");
      gameStartTime.current = Date.now();
      
      // Set up the game timer to increase multiplier
      gameTimer.current = setInterval(() => {
        setMultiplier(prev => {
          const newValue = mode === "easy" 
            ? prev + 0.1 
            : prev + 0.2;
          
          // Round to 2 decimal places
          const rounded = Math.round(newValue * 100) / 100;
          
          // Check if we've reached the crash point
          if (rounded >= data.crashPoint) {
            if (gameTimer.current) clearInterval(gameTimer.current);
            setGameState("crashed");
            
            // If the player didn't cash out, they lose
            if (cashoutPoint === null) {
              // Refresh user data
              queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
              
              toast({
                title: "Crashed!",
                description: `The multiplier crashed at ${data.crashPoint}x!`,
                variant: "destructive"
              });
            }
            
            return data.crashPoint;
          }
          
          return rounded;
        });
      }, mode === "easy" ? 500 : 250);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start crash game: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const { mutate: cashOut } = useMutation({
    mutationFn: async () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      
      setCashoutPoint(multiplier);
      const calculatedWinnings = Math.floor(bet * multiplier);
      setWinnings(calculatedWinnings);
      setGameState("cashed_out");
      
      // Simulate API call to record cashout
      // In a real app, this would call a backend endpoint
      return { cashoutPoint: multiplier, winnings: calculatedWinnings };
    },
    onSuccess: () => {
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      
      toast({
        title: "Cashed Out!",
        description: `You cashed out at ${cashoutPoint?.toFixed(2)}x and won ${winnings.toLocaleString()}!`,
        variant: "success"
      });
    }
  });
  
  const handleIncreaseBet = () => {
    setBet(prev => Math.min(prev + 1000, 100000));
  };
  
  const handleDecreaseBet = () => {
    setBet(prev => Math.max(prev - 1000, 1000));
  };
  
  const getElapsedTime = () => {
    if (!gameStartTime.current) return "0:00";
    
    const elapsed = Math.floor((Date.now() - gameStartTime.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-bomb mr-2 text-red-500"></i>
              Crash Game
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
                disabled={gameState === "playing"}
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
                    Easy Mode
                  </Button>
                  
                  <Button
                    variant={mode === "hard" ? "default" : "outline"}
                    onClick={() => setMode("hard")}
                  >
                    Hard Mode
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
              {/* Multiplier Display */}
              <div className="flex flex-col items-center justify-center py-6">
                {mode === "easy" && (
                  <div 
                    className={`text-6xl font-bold mb-2 ${
                      gameState === "crashed" 
                        ? "text-red-500" 
                        : gameState === "cashed_out" 
                          ? "text-green-500" 
                          : "text-white multiplier-animation"
                    }`}
                  >
                    {multiplier.toFixed(2)}x
                  </div>
                )}
                
                {gameState === "crashed" && (
                  <div className="text-3xl text-red-500 font-bold mt-4">
                    <i className="fas fa-bomb mr-2"></i>
                    CRASHED!
                  </div>
                )}
                
                {gameState === "cashed_out" && (
                  <div className="text-3xl text-green-500 font-bold mt-4">
                    <i className="fas fa-check-circle mr-2"></i>
                    CASHED OUT!
                  </div>
                )}
                
                {mode === "easy" && gameState === "playing" && (
                  <div className="text-sm text-gray-400 mt-2">
                    Game time: {getElapsedTime()}
                  </div>
                )}
              </div>
              
              {/* Game Actions */}
              {gameState === "playing" ? (
                <div className="flex space-x-3 pt-4">
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-500 text-white py-6 text-lg"
                    onClick={() => cashOut()}
                  >
                    🛑 CASH OUT
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {gameState === "cashed_out" && (
                    <div className="bg-[#36393F] rounded-lg p-4 text-center">
                      <h3 className="text-xl font-semibold mb-2">
                        You cashed out at {cashoutPoint?.toFixed(2)}x
                      </h3>
                      <p className="text-green-500 flex items-center justify-center">
                        <i className="fas fa-coins text-yellow-400 mr-2"></i>
                        +{winnings.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {gameState === "crashed" && (
                    <div className="bg-[#36393F] rounded-lg p-4 text-center">
                      <h3 className="text-xl font-semibold mb-2">
                        Crashed at {maxMultiplier.toFixed(2)}x
                      </h3>
                      
                      {cashoutPoint ? (
                        <p className="text-green-500 flex items-center justify-center">
                          <i className="fas fa-coins text-yellow-400 mr-2"></i>
                          +{winnings.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-red-500">You lost your bet!</p>
                      )}
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
                        setMultiplier(1.0);
                        setCashoutPoint(null);
                        setWinnings(0);
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
