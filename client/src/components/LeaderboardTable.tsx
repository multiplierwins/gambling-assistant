import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardTableProps {
  title: string;
  icon: string;
  iconClass: string;
  data: any[];
  isLoading: boolean;
  valueType: "cash" | "level";
}

export default function LeaderboardTable({
  title,
  icon,
  iconClass,
  data,
  isLoading,
  valueType
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[#2F3136] rounded-lg shadow-lg overflow-hidden">
        <div className={`bg-${valueType === "cash" ? "yellow" : "blue"}-500 bg-opacity-10 p-4 border-b border-${valueType === "cash" ? "yellow" : "blue"}-500 border-opacity-20`}>
          <h3 className="font-semibold text-lg flex items-center">
            <i className={`fas fa-${icon} ${iconClass} mr-2`}></i>
            {title}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center p-2 bg-[#36393F] rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
                <div className="flex-1 ml-2">
                  <Skeleton className="h-5 w-32 mb-1 bg-gray-700" />
                  <Skeleton className="h-3 w-20 bg-gray-700" />
                </div>
                <Skeleton className="h-5 w-24 bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#2F3136] rounded-lg shadow-lg overflow-hidden">
        <div className={`bg-${valueType === "cash" ? "yellow" : "blue"}-500 bg-opacity-10 p-4 border-b border-${valueType === "cash" ? "yellow" : "blue"}-500 border-opacity-20`}>
          <h3 className="font-semibold text-lg flex items-center">
            <i className={`fas fa-${icon} ${iconClass} mr-2`}></i>
            {title}
          </h3>
        </div>
        
        <div className="p-8 text-center text-gray-400">
          No leaderboard data available
        </div>
      </div>
    );
  }
  
  // Sort to get current user at the end
  const sortedData = [...data].sort((a, b) => {
    if (a.isCurrentUser && !b.isCurrentUser) return 1;
    if (!a.isCurrentUser && b.isCurrentUser) return -1;
    return 0;
  });
  
  const regularEntries = sortedData.filter(entry => !entry.isCurrentUser).slice(0, 5);
  const currentUserEntry = sortedData.find(entry => entry.isCurrentUser);
  
  return (
    <div className="bg-[#2F3136] rounded-lg shadow-lg overflow-hidden">
      <div className={`bg-${valueType === "cash" ? "yellow" : "blue"}-500 bg-opacity-10 p-4 border-b border-${valueType === "cash" ? "yellow" : "blue"}-500 border-opacity-20`}>
        <h3 className="font-semibold text-lg flex items-center">
          <i className={`fas fa-${icon} ${iconClass} mr-2`}></i>
          {title}
        </h3>
      </div>
      
      <div className="p-4">
        <div className="space-y-2">
          {regularEntries.map((entry, index) => (
            <div key={index} className="flex items-center p-2 bg-[#36393F] rounded-lg">
              <div className="w-8 h-8 flex items-center justify-center font-semibold">
                {entry.rank}
              </div>
              <div className="flex-1 ml-2">
                <div className="font-medium">{entry.username}</div>
                {valueType === "cash" ? (
                  <div className="text-xs text-[#B9BBBE]">Level {entry.level}</div>
                ) : (
                  <div className="text-xs text-[#B9BBBE] flex items-center">
                    <i className="fas fa-coins text-yellow-400 mr-1"></i>
                    {entry.cash?.toLocaleString()}
                  </div>
                )}
              </div>
              <div className={`font-medium ${valueType === "cash" ? "text-yellow-400" : "text-blue-500"} flex items-center`}>
                <i className={`fas fa-${valueType === "cash" ? "coins" : "star"} mr-1 text-sm`}></i>
                {valueType === "cash" 
                  ? entry.value?.toLocaleString() 
                  : entry.value
                }
              </div>
            </div>
          ))}
          
          {/* User position */}
          {currentUserEntry && (
            <div className="mt-4 border-t border-gray-700 pt-3 flex items-center p-2 bg-blue-500 bg-opacity-20 rounded-lg">
              <div className="w-8 h-8 flex items-center justify-center font-semibold">
                {currentUserEntry.rank}
              </div>
              <div className="flex-1 ml-2">
                <div className="font-medium">{currentUserEntry.username}</div>
                {valueType === "cash" ? (
                  <div className="text-xs text-[#B9BBBE]">Level {currentUserEntry.level}</div>
                ) : (
                  <div className="text-xs text-[#B9BBBE] flex items-center">
                    <i className="fas fa-coins text-yellow-400 mr-1"></i>
                    {currentUserEntry.cash?.toLocaleString()}
                  </div>
                )}
              </div>
              <div className={`font-medium ${valueType === "cash" ? "text-yellow-400" : "text-blue-500"} flex items-center`}>
                <i className={`fas fa-${valueType === "cash" ? "coins" : "star"} mr-1 text-sm`}></i>
                {valueType === "cash" 
                  ? currentUserEntry.value?.toLocaleString() 
                  : currentUserEntry.value
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
