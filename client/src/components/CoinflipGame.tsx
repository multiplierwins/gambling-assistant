import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CoinflipGameProps {
  onClose: () => void;
}

export default function CoinflipGame({ onClose }: CoinflipGameProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(5000);
  const [prediction, setPrediction] = useState<"heads" | "tails">("heads");
  const [gameState, setGameState] = useState<"initial" | "flipping" | "result">("initial");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [winnings, setWinnings] = useState(0);
  const [flipping, setFlipping] = useState(false);
  
  const { mutate: playGame, isPending: isPlaying } = useMutation({
    mutationFn: async () => {
      setGameState("flipping");
      setFlipping(true);
      
      // Simulate coin flip animation
      return new Promise((resolve) => {
        setTimeout(async () => {
          const response = await apiRequest("POST", "/api/games/coinflip", {
            prediction,
            bet
          });
          const data = await response.json();
          resolve(data);
        }, 2000); // Flip animation lasts 2 seconds
      });
    },
    onSuccess: (data) => {
      setResult(data.result);
      setIsWin(data.isWin);
      setWinnings(data.winnings);
      setGameState("result");
      setFlipping(false);
      
      // Refresh user data to update cash
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error) => {
      setFlipping(false);
      setGameState("initial");
      toast({
        title: "Error",
        description: `Failed to play coinflip: ${error.message}`,
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
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-coins mr-2 text-yellow-400"></i>
              Coinflip Game
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
          
          <div className="flex flex-col items-center justify-center">
            {/* Coin Display */}
            <div className="mb-8 mt-4">
              {gameState === "initial" ? (
                <div className="w-40 h-40 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-800 font-bold text-5xl shadow-lg border-8 border-yellow-500">
                  P
                </div>
              ) : (
                <div className={`w-40 h-40 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-800 font-bold text-5xl shadow-lg border-8 border-yellow-500 ${flipping ? 'coin' : ''}`}>
                  {result === "heads" ? "H" : result === "tails" ? "T" : "?"}
                </div>
              )}
            </div>
            
            {gameState === "initial" && (
              <div className="space-y-6 w-full max-w-md">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Choose your prediction:</h3>
                  <RadioGroup 
                    value={prediction} 
                    onValueChange={(value) => setPrediction(value as "heads" | "tails")}
                    className="flex justify-center space-x-8"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="heads" id="heads" />
                      <Label htmlFor="heads" className="text-lg">Heads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tails" id="tails" />
                      <Label htmlFor="tails" className="text-lg">Tails</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Place your bet:</h3>
                  <div className="flex items-center space-x-4 justify-center">
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
                
                <Button 
                  className="w-full py-6 text-lg mt-4"
                  onClick={() => playGame()}
                  disabled={isPlaying}
                >
                  {isPlaying ? "Flipping coin..." : "Flip Coin"}
                </Button>
              </div>
            )}
            
            {gameState === "flipping" && (
              <div className="text-center text-xl font-medium mt-4">
                Flipping the coin...
              </div>
            )}
            
            {gameState === "result" && (
              <div className="space-y-6 w-full max-w-md">
                <div className="bg-[#36393F] rounded-lg p-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    Result: {result?.toUpperCase()}
                  </h3>
                  
                  <h4 className="text-2xl font-bold mt-4">
                    {isWin ? (
                      <span className="text-green-500">You won!</span>
                    ) : (
                      <span className="text-red-500">You lost!</span>
                    )}
                  </h4>
                  
                  {isWin && (
                    <p className="text-green-500 flex items-center justify-center mt-2">
                      <i className="fas fa-coins text-yellow-400 mr-2"></i>
                      +{winnings.toLocaleString()}
                    </p>
                  )}
                </div>
                
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
                      setResult(null);
                    }}
                  >
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
