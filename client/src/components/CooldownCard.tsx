import { Skeleton } from "@/components/ui/skeleton";

interface CooldownCardProps {
  cooldowns: any[];
  isLoading: boolean;
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "Ready";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
}

export default function CooldownCard({ cooldowns, isLoading }: CooldownCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-6 w-32 bg-gray-700" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <Skeleton className="h-5 w-24 mb-1 bg-gray-700" />
                <Skeleton className="h-3 w-40 bg-gray-700" />
              </div>
              <Skeleton className="h-5 w-20 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#2F3136] rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <i className="fas fa-clock text-blue-500 mr-2"></i>
        Cooldowns
      </h3>
      
      <div className="space-y-4">
        {cooldowns?.map((cooldown, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <span className="font-medium">{cooldown.label}</span>
              <p className="text-xs text-[#B9BBBE]">{cooldown.description}</p>
            </div>
            {cooldown.isReady ? (
              <div className="text-green-500 font-medium">
                <i className="fas fa-check-circle mr-1"></i> Ready
              </div>
            ) : (
              <div className="text-red-500 font-medium">
                <i className="fas fa-hourglass-half mr-1"></i> {formatTimeLeft(cooldown.timeLeft)}
              </div>
            )}
          </div>
        ))}
        
        {!cooldowns || cooldowns.length === 0 ? (
          <div className="text-center text-[#B9BBBE] py-2">
            No cooldowns available
          </div>
        ) : null}
      </div>
    </div>
  );
}
