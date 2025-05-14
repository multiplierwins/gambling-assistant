import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  user: any;
  isLoading: boolean;
}

export default function StatsCard({ user, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-6 w-32 bg-gray-700" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#36393F] rounded-lg p-3 flex justify-between items-center">
              <Skeleton className="h-4 w-24 bg-gray-700" />
              <Skeleton className="h-4 w-24 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const stats = user?.stats || {
    highestWin: 0,
    favoriteGame: "None",
    globalRank: 0,
    serverRank: 0
  };
  
  return (
    <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <i className="fas fa-chart-line text-blue-500 mr-2"></i>
        Quick Stats
      </h3>
      
      <div className="space-y-3">
        <div className="bg-[#36393F] rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm">Highest Win</span>
          <span className="font-medium text-green-500 flex items-center">
            <i className="fas fa-coins text-yellow-400 mr-1"></i>
            <span>{user?.highestWin?.toLocaleString() || 0}</span>
          </span>
        </div>
        
        <div className="bg-[#36393F] rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm">Favorite Game</span>
          <span className="font-medium">{stats.favoriteGame}</span>
        </div>
        
        <div className="bg-[#36393F] rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm">Global Rank</span>
          <span className="font-medium text-yellow-400 flex items-center">
            <i className="fas fa-trophy mr-1"></i>
            <span>{stats.globalRank}</span>
          </span>
        </div>
        
        <div className="bg-[#36393F] rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm">Server Rank</span>
          <span className="font-medium text-yellow-400 flex items-center">
            <i className="fas fa-medal mr-1"></i>
            <span>{stats.serverRank}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
