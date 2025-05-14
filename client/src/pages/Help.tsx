import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CommandsList from "@/components/CommandsList";
import CommandDetails from "@/components/CommandDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function Help() {
  const [activeCategory, setActiveCategory] = useState("games");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  
  const { data: commands, isLoading } = useQuery({
    queryKey: [`/api/commands?category=${activeCategory}&search=${searchQuery}`],
  });
  
  const { data: commandDetails, isLoading: isCommandDetailsLoading } = useQuery({
    queryKey: [selectedCommand ? `/api/commands/${selectedCommand}` : null],
    enabled: !!selectedCommand
  });
  
  return (
    <section id="help" className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold font-poppins mb-3">Commands & Help</h2>
        <p className="text-[#B9BBBE]">Find all available commands and how to use them below.</p>
      </div>
      
      <div className="bg-[#2F3136] rounded-lg shadow-lg overflow-hidden">
        <Tabs defaultValue="games" onValueChange={setActiveCategory}>
          <TabsList className="flex border-b border-gray-700 w-full rounded-none">
            <TabsTrigger className="flex-1 px-4 py-3" value="games">Games</TabsTrigger>
            <TabsTrigger className="flex-1 px-4 py-3" value="economy">Economy</TabsTrigger>
            <TabsTrigger className="flex-1 px-4 py-3" value="profile">Profile</TabsTrigger>
            <TabsTrigger className="flex-1 px-4 py-3" value="other">Other</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#36393F] rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="fas fa-search absolute left-3 top-3 text-[#B9BBBE]"></i>
              </div>
            </div>
            
            <CommandsList
              commands={commands || []}
              isLoading={isLoading}
              onSelectCommand={setSelectedCommand}
            />
          </div>
        </Tabs>
      </div>
      
      {selectedCommand && commandDetails && (
        <CommandDetails 
          command={commandDetails}
          isLoading={isCommandDetailsLoading}
          onClose={() => setSelectedCommand(null)}
        />
      )}
    </section>
  );
}
