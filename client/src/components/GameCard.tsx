import { Button } from "@/components/ui/button";

interface GameCardProps {
  title: string;
  description: string;
  odds: string;
  command: string;
  bgClass: string;
  icon: () => JSX.Element;
  onClick: () => void;
}

export default function GameCard({
  title,
  description,
  odds,
  command,
  bgClass,
  icon,
  onClick
}: GameCardProps) {
  return (
    <div className="game-card bg-[#2F3136] rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className={`h-40 bg-gradient-to-r ${bgClass} p-4 flex items-center justify-center relative`}>
        {icon()}
        <h3 className="text-3xl font-bold font-poppins relative z-10">{title}</h3>
      </div>
      
      <div className="p-4">
        <p className="text-[#B9BBBE] mb-3">{description}</p>
        
        <div className="mb-4">
          <span className="text-xs text-[#B9BBBE]">ODDS</span>
          <div className="font-medium">{odds}</div>
        </div>
        
        <div className="mb-4">
          <span className="text-xs text-[#B9BBBE]">COMMAND</span>
          <div className="bg-[#36393F] rounded font-mono text-sm p-2 mt-1">{command}</div>
        </div>
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md transition-colors flex items-center justify-center"
          onClick={onClick}
        >
          <i className="fas fa-play-circle mr-2"></i> Play {title}
        </Button>
      </div>
    </div>
  );
}
