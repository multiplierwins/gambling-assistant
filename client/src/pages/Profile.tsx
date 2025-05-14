import { useQuery } from "@tanstack/react-query";
import ProfileCard from "@/components/ProfileCard";
import CooldownCard from "@/components/CooldownCard";
import StatsCard from "@/components/StatsCard";

export default function Profile() {
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/users/me"],
  });
  
  const { data: cooldowns, isLoading: isCooldownsLoading } = useQuery({
    queryKey: ["/api/cooldowns"],
  });
  
  return (
    <section id="profile" className="p-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <ProfileCard user={user} isLoading={isUserLoading} />
        
        {/* Cooldowns Card */}
        <CooldownCard cooldowns={cooldowns} isLoading={isCooldownsLoading} />
        
        {/* Quick Stats Card */}
        <StatsCard user={user} isLoading={isUserLoading} />
      </div>
    </section>
  );
}
