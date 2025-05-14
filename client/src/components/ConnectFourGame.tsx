import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ConnectFourGameProps {
  onClose: () => void;
}

type Cell = null | "red" | "yellow";
type Board = Cell[][];
type GameState = "waiting" | "playing" | "finished";

export default function ConnectFourGame({ onClose }: ConnectFourGameProps) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [board, setBoard] = useState<Board>(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red");
  const [winner, setWinner] = useState<Cell>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  
  const { mutate: createGame, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games/connectfour", {});
      return response.json();
    },
    onSuccess: (data) => {
      setGameId(data.gameId);
      
      // In a real app, we would wait for an opponent
      // For now, simulate finding an opponent after a delay
      toast({
        title: "Game created",
        description: "Waiting for an opponent to join..."
      });
      
      setTimeout(() => {
        setOpponent("Bot#1234"); // Simulated opponent
        setGameState("playing");
        
        toast({
          title: "Opponent found!",
          description: "Bot#1234 has joined the game."
        });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create game: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // In a real app, we would use this to send moves to the server
  const makeMove = (col: number) => {
    if (gameState !== "playing" || winner) return;
    
    // Find the lowest empty row in the selected column
    const newBoard = [...board.map(row => [...row])];
    let row = -1;
    
    for (let r = board.length - 1; r >= 0; r--) {
      if (!board[r][col]) {
        row = r;
        break;
      }
    }
    
    if (row === -1) return; // Column is full
    
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    
    // Check for win
    if (checkWin(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer);
      setGameState("finished");
      return;
    }
    
    // Check for draw
    if (newBoard.every(row => row.every(cell => cell !== null))) {
      setGameState("finished");
      return;
    }
    
    // Switch player
    setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red");
    
    // If playing against bot, simulate bot move
    if (opponent === "Bot#1234" && currentPlayer === "red") {
      setTimeout(() => {
        const validColumns = Array.from({length: 7}, (_, i) => i)
          .filter(col => !newBoard[0][col]);
        
        if (validColumns.length > 0) {
          const botCol = validColumns[Math.floor(Math.random() * validColumns.length)];
          makeMove(botCol);
        }
      }, 1000);
    }
  };
  
  const checkWin = (board: Board, row: number, col: number, player: "red" | "yellow"): boolean => {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal down-right
      [1, -1]  // diagonal down-left
    ];
    
    for (const [dx, dy] of directions) {
      let count = 1;
      
      // Check one direction
      for (let i = 1; i <= 3; i++) {
        const r = row + i * dx;
        const c = col + i * dy;
        
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== player) {
          break;
        }
        
        count++;
      }
      
      // Check opposite direction
      for (let i = 1; i <= 3; i++) {
        const r = row - i * dx;
        const c = col - i * dy;
        
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== player) {
          break;
        }
        
        count++;
      }
      
      if (count >= 4) return true;
    }
    
    return false;
  };
  
  return (
    <section id="active-game" className="p-6">
      <Card className="bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-poppins flex items-center">
              <i className="fas fa-chess-board mr-2 text-blue-500"></i>
              Connect Four
            </h2>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-times-circle text-xl"></i>
            </Button>
          </div>
          
          {gameState === "waiting" ? (
            <div className="space-y-6 py-8 text-center">
              <h3 className="text-xl font-medium mb-4">
                Play Connect Four with a friend or random opponent!
              </h3>
              
              <p className="text-gray-400 mb-6">
                Get 4 in a row horizontally, vertically, or diagonally to win.
              </p>
              
              <Button 
                className="w-full max-w-md mx-auto py-6 text-lg"
                onClick={() => createGame()}
                disabled={isCreating}
              >
                {isCreating ? "Creating game..." : "Start Game"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Game status */}
              <div className="flex justify-between items-center px-2 py-3 bg-[#36393F] rounded-lg">
                <div>
                  <span className="text-sm text-gray-400">You</span>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span className="font-medium">Red</span>
                  </div>
                </div>
                
                <div className="text-center">
                  {gameState === "playing" && (
                    <div className="font-medium">
                      {currentPlayer === "red" ? "Your turn" : "Opponent's turn"}
                    </div>
                  )}
                  {gameState === "finished" && winner && (
                    <div className={`font-medium ${winner === "red" ? "text-green-500" : "text-red-500"}`}>
                      {winner === "red" ? "You won!" : "Opponent won!"}
                    </div>
                  )}
                  {gameState === "finished" && !winner && (
                    <div className="font-medium text-gray-400">
                      Draw!
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-gray-400">Opponent</span>
                  <div className="flex items-center justify-end">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="font-medium">{opponent || "Waiting..."}</span>
                  </div>
                </div>
              </div>
              
              {/* Game board */}
              <div className="flex flex-col items-center">
                {/* Column selectors */}
                {gameState === "playing" && currentPlayer === "red" && (
                  <div className="grid grid-cols-7 gap-1 mb-1 w-full max-w-md">
                    {[0, 1, 2, 3, 4, 5, 6].map(col => (
                      <Button
                        key={col}
                        variant="ghost"
                        className="h-8 p-0"
                        onClick={() => makeMove(col)}
                        disabled={board[0][col] !== null}
                      >
                        <i className="fas fa-arrow-down text-gray-400"></i>
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Board */}
                <div className="bg-blue-800 p-2 rounded-lg">
                  <div className="grid grid-cols-7 gap-1">
                    {board.map((row, rowIndex) => (
                      row.map((cell, colIndex) => (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 rounded-full flex items-center justify-center"
                        >
                          {cell && (
                            <div 
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                                cell === "red" ? "bg-red-500" : "bg-yellow-400"
                              } border-2 border-gray-700`}
                            ></div>
                          )}
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Game actions */}
              {gameState === "finished" && (
                <div className="flex space-x-4 mt-4">
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
                      setGameState("waiting");
                      setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
                      setCurrentPlayer("red");
                      setWinner(null);
                      setOpponent(null);
                    }}
                  >
                    New Game
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
