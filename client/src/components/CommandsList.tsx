import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CommandsListProps {
  commands: any[];
  isLoading: boolean;
  onSelectCommand: (command: string) => void;
}

export default function CommandsList({
  commands,
  isLoading,
  onSelectCommand
}: CommandsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-[#36393F] rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-5 w-48 mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-72 bg-gray-700" />
              </div>
              <Skeleton className="h-8 w-24 bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!commands || commands.length === 0) {
    return (
      <div className="bg-[#36393F] rounded-lg p-8 text-center text-gray-400">
        No commands found. Try a different search or category.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {commands.map((command, index) => (
        <div key={index} className="bg-[#36393F] rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono font-medium">{command.name}</div>
              <p className="text-sm text-[#B9BBBE] mt-1">{command.description}</p>
            </div>
            <Button 
              className="text-blue-500 hover:text-blue-400 text-sm"
              variant="ghost"
              onClick={() => onSelectCommand(command.name.split(" ")[0].replace("/", ""))}
            >
              Details <i className="fas fa-chevron-right ml-1"></i>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
