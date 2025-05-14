import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Import slot machine symbol assets
import barImage from "@assets/sbar.png";
import bellImage from "@assets/sbell.png";
import cherryImage from "@assets/scherry.png";
import diamondImage from "@assets/sdiamond.png";
import heartImage from "@assets/sheart.png";
import lemonImage from "@assets/slemon.png";
import melonImage from "@assets/smelon.png";
import sevenImage from "@assets/sseven.png";
import shoeImage from "@assets/sshoe.png";

interface SlotMachineGameProps {
  onClose: () => void;
}

// Map of symbol IDs to their image paths
const symbolImages: Record<string, string> = {
  bar: barImage,
  bell: bellImage,
  cherry: cherryImage,
  diamond: diamondImage,
  heart: heartImage,
  lemon: lemonImage,
  melon: melonImage,
  seven: sevenImage,
  shoe: shoeImage,
};

type Symbol = {
  id: string;
  name: string;
  payout: number;
};

type SlotGrid = Symbol[][];

type WinningLine = {
  line: number;
  symbols: string[];
  multiplier: number;
};

type GameResult = {
  gameId: number;
  gameType: string;
  bet: number;
  lines: number;
  grid: SlotGrid;
  winningLines: WinningLine[];
  totalWinnings: number;
  isWin: boolean;
};

export default function SlotMachineGame({ onClose }: SlotMachineGameProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(1);
  const [gameState, setGameState] = useState<"initial" | "spinning" | "result">("initial");
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayedGrid, setDisplayedGrid] = useState<SlotGrid | null>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);
  
  const { mutate: spinSlots, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games/slotmachine", {
        bet,
        lines
      });
      return response.json();
    },
    onSuccess: (data: GameResult) => {
      // First set to spinning state
      setGameState("spinning");
      setSpinning(true);
      
      // Create a temporary grid for animation
      const tempSymbols = Object.keys(symbolImages);
      
      // Start the spinning animation by continuously shuffling symbols
      let spinCount = 0;
      const maxSpins = 20; // Number of visual "spins" before settling on the result
      
      const interval = setInterval(() => {
        spinCount++;
        
        // Generate a random grid for animation
        const animGrid = Array(3).fill(0).map(() => 
          Array(5).fill(0).map(() => {
            const randomSymbolId = tempSymbols[Math.floor(Math.random() * tempSymbols.length)];
            return {
              id: randomSymbolId,
              name: randomSymbolId.charAt(0).toUpperCase() + randomSymbolId.slice(1),
              payout: 0
            };
          })
        );
        
        setDisplayedGrid(animGrid);
        
        // End spinning and show the result
        if (spinCount >= maxSpins) {
          clearInterval(interval);
          setDisplayedGrid(data.grid);
          setGameResult(data);
          setGameState("result");
          setSpinning(false);
          
          // Refresh user data to update cash amount
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          
          // Show winning or losing toast
          if (data.isWin) {
            toast({
              title: "You Won!",
              description: `You won ${data.totalWinnings.toLocaleString()} coins!`,
              variant: "default"
            });
          } else {
            toast({
              title: "Better luck next time!",
              description: `You lost ${(data.bet * data.lines).toLocaleString()} coins.`,
              variant: "destructive"
            });
          }
        }
      }, 100); // Update every 100ms for a fast spinning effect
      
      spinIntervalRef.current = interval;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to spin: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleIncreaseBet = () => {
    setBet(prev => Math.min(prev + 100, 10000));
  };
  
  const handleDecreaseBet = () => {
    setBet(prev => Math.max(prev - 100, 100));
  };
  
  const handleIncreaseLines = () => {
    setLines(prev => Math.min(prev + 1, 5));
  };
  
  const handleDecreaseLines = () => {
    setLines(prev => Math.max(prev - 1, 1));
  };
  
  // Render a symbol cell
  const renderSymbol = (symbol: Symbol) => {
    return (
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-[#36393F] rounded-md p-1 overflow-hidden">
        <img 
          src={symbolImages[symbol.id]} 
          alt={symbol.name} 
          className="max-w-full max-h-full object-contain transform transition-transform duration-100"
        />
      </div>
    );
  };
  
  // Highlight the winning lines
  const isInWinningLine = (row: number, col: number) => {
    if (!gameResult || !gameResult.winningLines.length) return false;
    
    // Check each winning line pattern
    const linePatterns = [
      [0, 0, 0, 0, 0], // Top row
      [1, 1, 1, 1, 1], // Middle row
      [2, 2, 2, 2, 2], // Bottom row
      [0, 1, 2, 1, 0], // V shape
      [2, 1, 0, 1, 2]  // Inverted V shape
    ];
    
    return gameResult.winningLines.some(winLine => {
      const pattern = linePatterns[winLine.line - 1];
      return pattern[col] === row;
    });
  };
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-dice mr-2 text-yellow-500"></i>
              Slot Machine
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
                disabled={gameState === "spinning"}
              >
                <i className="fas fa-times-circle text-xl"></i>
              </Button>
            </div>
          </div>
          
          {gameState === "initial" || !displayedGrid ? (
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
                <h3 className="text-lg font-semibold">Paylines: {lines}</h3>
                
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={handleDecreaseLines} disabled={lines <= 1}>
                    <i className="fas fa-minus"></i>
                  </Button>
                  
                  <div className="flex-1">
                    <Slider 
                      value={[lines]} 
                      min={1} 
                      max={5} 
                      step={1} 
                      onValueChange={(value) => setLines(value[0])}
                    />
                  </div>
                  
                  <Button variant="outline" onClick={handleIncreaseLines} disabled={lines >= 5}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-400">
                  Total bet: {bet * lines} coins
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full py-6 text-lg bg-yellow-600 hover:bg-yellow-500"
                  onClick={() => spinSlots()}
                  disabled={isPending}
                >
                  {isPending ? "Spinning..." : "SPIN"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Slot Machine Display */}
              <div className="bg-[#1E2124] p-4 rounded-lg">
                <div className="grid grid-cols-5 gap-2 justify-items-center">
                  {displayedGrid.map((row, rowIndex) => (
                    row.map((symbol, colIndex) => (
                      <div 
                        key={`${rowIndex}-${colIndex}`} 
                        className={`${
                          !spinning && isInWinningLine(rowIndex, colIndex) 
                            ? 'border-2 border-yellow-500 rounded-md shadow-lg shadow-yellow-500/50 animate-pulse' 
                            : ''
                        }`}
                      >
                        {renderSymbol(symbol)}
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              {/* Result Display */}
              {gameState === "result" && gameResult && (
                <div className="bg-[#36393F] rounded-lg p-4 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {gameResult.isWin 
                      ? `You Won ${gameResult.totalWinnings.toLocaleString()} Coins!` 
                      : "Better luck next time!"}
                  </h3>
                  
                  {gameResult.isWin && gameResult.winningLines.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="text-green-400">Winning Lines: {gameResult.winningLines.map(line => line.line).join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-4 pt-2">
                <Button 
                  className="flex-1 py-4"
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                
                <Button 
                  className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500"
                  onClick={() => {
                    setGameState("initial");
                    setGameResult(null);
                    setDisplayedGrid(null);
                  }}
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Paytable */}
          <div className="mt-6 p-4 bg-[#36393F] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Paytable</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <img src={sevenImage} alt="Seven" className="w-6 h-6" />
                <span>Seven: 15x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={diamondImage} alt="Diamond" className="w-6 h-6" />
                <span>Diamond: 12x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={barImage} alt="Bar" className="w-6 h-6" />
                <span>Bar: 10x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={bellImage} alt="Bell" className="w-6 h-6" />
                <span>Bell: 8x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={shoeImage} alt="Shoe" className="w-6 h-6" />
                <span>Shoe: 7x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={heartImage} alt="Heart" className="w-6 h-6" />
                <span>Heart: 6x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={cherryImage} alt="Cherry" className="w-6 h-6" />
                <span>Cherry: 5x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={melonImage} alt="Melon" className="w-6 h-6" />
                <span>Melon: 4x</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src={lemonImage} alt="Lemon" className="w-6 h-6" />
                <span>Lemon: 3x</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              <p>Match 3 or more symbols in a line to win. Multiplier increases with more matches.</p>
              <p>Win multipliers: 3 matches = 1x, 4 matches = 2x, 5 matches = 3x</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}