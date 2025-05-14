import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface CommandDetailsProps {
  command: any;
  isLoading: boolean;
  onClose: () => void;
}

export default function CommandDetails({
  command,
  isLoading,
  onClose
}: CommandDetailsProps) {
  if (isLoading) {
    return (
      <Card className="mt-6 bg-[#2F3136] shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-48 bg-gray-700" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <Skeleton className="h-16 w-full mb-4 bg-gray-700" />
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton className="h-5 w-32 mb-2 bg-gray-700" />
                <Skeleton className="h-20 w-full bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!command) return null;
  
  return (
    <Card className="mt-6 bg-[#2F3136] shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold font-poppins">Command Details</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        
        <div className="bg-[#36393F] rounded-lg p-4 mb-4">
          <div className="font-mono text-lg">{command.fullName}</div>
          <div className="mt-2 text-[#B9BBBE]">
            Alternatives: <span className="text-white">
              {command.details.alternatives?.join(", ") || "None"}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Description</h4>
            <p className="text-[#B9BBBE]">{command.description}</p>
          </div>
          
          {command.details.options && command.details.options.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Options</h4>
              <div className="space-y-2">
                {command.details.options.map((option: any, index: number) => (
                  <div key={index} className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                    <div className="font-medium">
                      {option.name} 
                      <span className={option.required ? "text-red-500" : "text-[#B9BBBE]"}>
                        {" "}{option.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="text-sm text-[#B9BBBE]">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {command.details.modes && command.details.modes.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Difficulty Modes</h4>
              <div className="space-y-2">
                {command.details.modes.map((mode: any, index: number) => (
                  <div key={index} className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                    <div className="font-medium">{mode.name}</div>
                    <p className="text-sm text-[#B9BBBE]">{mode.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {command.details.examples && command.details.examples.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Examples</h4>
              <div className="space-y-2">
                {command.details.examples.map((example: string, index: number) => (
                  <div key={index} className="bg-[#36393F] bg-opacity-50 p-2 rounded font-mono text-sm">
                    {example}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {command.details.odds && (
            <div>
              <h4 className="font-medium mb-1">Odds</h4>
              <div className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                {command.details.odds}
              </div>
            </div>
          )}
          
          {command.details.type && (
            <div>
              <h4 className="font-medium mb-1">Type</h4>
              <div className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                {command.details.type}
              </div>
            </div>
          )}
          
          {command.details.cooldown && (
            <div>
              <h4 className="font-medium mb-1">Cooldown</h4>
              <div className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                {command.details.cooldown}
              </div>
            </div>
          )}
          
          {command.details.reward && (
            <div>
              <h4 className="font-medium mb-1">Reward</h4>
              <div className="bg-[#36393F] bg-opacity-50 p-2 rounded">
                {command.details.reward}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
