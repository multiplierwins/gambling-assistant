import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileCardProps {
  user: any;
  isLoading: boolean;
}

export default function ProfileCard({ user, isLoading }: ProfileCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Skeleton className="w-16 h-16 rounded-full bg-gray-700" />
          <div className="ml-4">
            <Skeleton className="h-6 w-40 mb-2 bg-gray-700" />
            <Skeleton className="h-4 w-24 bg-gray-700" />
          </div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 bg-gray-700" />
              <Skeleton className="h-4 w-24 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Calculate XP progress as a percentage
  const xpProgress = user ? Math.min(100, (user.xp / user.nextLevelXP) * 100) : 0;
  
  return (
    <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Avatar className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
          <AvatarFallback>
            {user?.username?.slice(0, 2).toUpperCase() || "JD"}
          </AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <h3 className="text-xl font-semibold">{user?.username || "User#0000"}</h3>
          <div className="flex items-center mt-1">
            <span className="text-[#B9BBBE] mr-2">Level</span>
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-sm font-medium">
              {user?.level || 0}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[#B9BBBE]">Cash</span>
          <span className="font-medium flex items-center">
            <i className="fas fa-coins text-yellow-400 mr-1"></i>
            <span>{user?.cash?.toLocaleString() || 0}</span>
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#B9BBBE]">XP</span>
          <span className="font-medium">{user?.xp?.toLocaleString() || 0} / {user?.nextLevelXP?.toLocaleString() || 0}</span>
        </div>
        
        {/* XP Progress Bar */}
        <Progress value={xpProgress} className="h-2.5 bg-gray-700" />
        
        <div className="flex justify-between items-center">
          <span className="text-[#B9BBBE]">Wins</span>
          <span className="font-medium text-green-500">{user?.wins?.toLocaleString() || 0}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#B9BBBE]">Losses</span>
          <span className="font-medium text-red-500">{user?.losses?.toLocaleString() || 0}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#B9BBBE]">Win Rate</span>
          <span className="font-medium">{user?.winRate || 0}%</span>
        </div>
      </div>
    </div>
  );
}
