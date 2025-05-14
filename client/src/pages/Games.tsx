import GameCard from "@/components/GameCard";
import { useState } from "react";
import BlackjackGame from "@/components/BlackjackGame";
import CoinflipGame from "@/components/CoinflipGame";
import CrashGame from "@/components/CrashGame";
import FindTheLadyGame from "@/components/FindTheLadyGame";
import ConnectFourGame from "@/components/ConnectFourGame";

type GameType = "blackjack" | "coinflip" | "crash" | "findthelady" | "connectfour" | "random" | null;

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  
  const games = [
    {
      id: "blackjack",
      title: "Blackjack",
      description: "Try to get cards totaling 21 without going over. Beat the dealer's hand to win!",
      odds: "3:2 (Easy) / 2:1 (Hard)",
      command: "/blackjack [bet] [mode]",
      bgClass: "from-green-800 to-green-900",
      icon: () => (
        <div className="absolute inset-0 opacity-20 flex overflow-hidden">
          <div className="transform -rotate-12 -ml-4">
            <div className="w-24 h-32 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300">
              <span className="text-4xl">A♠</span>
            </div>
          </div>
          <div className="transform rotate-12 ml-4">
            <div className="w-24 h-32 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300">
              <span className="text-4xl">J♥</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "coinflip",
      title: "Coinflip",
      description: "Heads or tails? Make your prediction and flip the coin to win or lose your bet!",
      odds: "1:1",
      command: "/coinflip [prediction] [bet]",
      bgClass: "from-yellow-600 to-yellow-700",
      icon: () => (
        <div className="absolute inset-0 opacity-30 flex items-center justify-center">
          <div className="coin w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-xl shadow-lg border-4 border-yellow-500">
            P
          </div>
        </div>
      )
    },
    {
      id: "crash",
      title: "Crash",
      description: "The multiplier increases until it crashes! Cash out before it's too late.",
      odds: "High Risk",
      command: "/crash [bet] [mode]",
      bgClass: "from-red-800 to-red-900",
      icon: () => (
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <div className="text-6xl font-bold multiplier-animation text-red-500">
            <i className="fas fa-bomb"></i>
          </div>
        </div>
      )
    },
    {
      id: "findthelady",
      title: "Find The Lady",
      description: "Find the Queen among the Kings after the shuffle. Easy or hard mode!",
      odds: "1:3 (Easy) / 1:5 (Hard)",
      command: "/findthelady [bet] [mode]",
      bgClass: "from-purple-800 to-purple-900",
      icon: () => (
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <div className="flex space-x-2">
            <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300 transform rotate-6">
              <span className="text-2xl">Q♥</span>
            </div>
            <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300">
              <span className="text-2xl">K♠</span>
            </div>
            <div className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-black font-semibold border border-gray-300 transform -rotate-6">
              <span className="text-2xl">K♣</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "connectfour",
      title: "Connect Four",
      description: "Challenge a friend to a game of Connect Four! Get 4 in a row to win.",
      odds: "Multiplayer",
      command: "/connectfour",
      bgClass: "from-blue-800 to-blue-900",
      icon: () => (
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-1">
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-blue-400"></div>
            <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-400"></div>
          </div>
        </div>
      )
    },
    {
      id: "random",
      title: "Random Game",
      description: "Can't decide? Let the bot choose a random game for you to play!",
      odds: "All Games",
      command: "/gamble [bet] [mode]",
      bgClass: "from-gray-700 to-gray-800",
      icon: () => (
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <div className="text-6xl">
            <i className="fas fa-random"></i>
          </div>
        </div>
      )
    }
  ];
  
  const renderActiveGame = () => {
    switch (activeGame) {
      case "blackjack":
        return <BlackjackGame onClose={() => setActiveGame(null)} />;
      case "coinflip":
        return <CoinflipGame onClose={() => setActiveGame(null)} />;
      case "crash":
        return <CrashGame onClose={() => setActiveGame(null)} />;
      case "findthelady":
        return <FindTheLadyGame onClose={() => setActiveGame(null)} />;
      case "connectfour":
        return <ConnectFourGame onClose={() => setActiveGame(null)} />;
      case "random":
        // For random, let's just pick one of the above
        const gameOptions = ["blackjack", "coinflip", "crash", "findthelady"] as const;
        const randomGame = gameOptions[Math.floor(Math.random() * gameOptions.length)];
        setActiveGame(randomGame);
        return null;
      default:
        return null;
    }
  };
  
  if (activeGame) {
    return renderActiveGame();
  }
  
  return (
    <section id="games" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold font-poppins">Gambling Games</h2>
        <div className="text-sm bg-[#2F3136] rounded-lg px-3 py-1 text-[#B9BBBE]">
          <i className="fas fa-info-circle mr-1"></i> Use /help [game] for more info
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <GameCard
            key={game.id}
            title={game.title}
            description={game.description}
            odds={game.odds}
            command={game.command}
            bgClass={game.bgClass}
            icon={game.icon}
            onClick={() => setActiveGame(game.id as GameType)}
          />
        ))}
      </div>
    </section>
  );
}
