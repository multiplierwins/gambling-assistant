import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Leaderboard() {
  const [scope, setScope] = useState<'server' | 'global'>('server');
  
  const { data: cashLeaderboard, isLoading: isCashLoading } = useQuery({
    queryKey: [`/api/leaderboard/cash${scope === 'server' ? '?server=true' : ''}`],
  });
  
  const { data: levelLeaderboard, isLoading: isLevelLoading } = useQuery({
    queryKey: [`/api/leaderboard/level${scope === 'server' ? '?server=true' : ''}`],
  });
  
  return (
    <section id="leaderboard" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold font-poppins">Leaderboards</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant={scope === 'server' ? 'default' : 'outline'} 
            onClick={() => setScope('server')}
          >
            Server
          </Button>
          <Button 
            variant={scope === 'global' ? 'default' : 'outline'} 
            onClick={() => setScope('global')}
          >
            Global
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Richest Players Leaderboard */}
        <LeaderboardTable
          title="Richest Players"
          icon="coins"
          iconClass="text-yellow-400"
          data={cashLeaderboard}
          isLoading={isCashLoading}
          valueType="cash"
        />
        
        {/* Highest Level Leaderboard */}
        <LeaderboardTable
          title="Highest Level"
          icon="star"
          iconClass="text-blue-500"
          data={levelLeaderboard}
          isLoading={isLevelLoading}
          valueType="level"
        />
      </div>
    </section>
  );
}
