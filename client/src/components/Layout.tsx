import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const currentPage = location === "/" ? "profile" : location.replace("/", "");
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users/me"],
  });
  
  // Get the title based on the current page
  const getPageTitle = () => {
    switch (currentPage) {
      case "profile":
        return "Profile Dashboard";
      case "games":
        return "Gambling Games";
      case "leaderboard":
        return "Leaderboards";
      case "help":
        return "Commands & Help";
      default:
        return "Piglet Gambling Bot";
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} user={user} />
      
      {/* Mobile Navigation */}
      <MobileNav currentPage={currentPage} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-[#2F3136] py-4 px-6 shadow-md sticky top-0 z-10 flex justify-between items-center">
          <div className="md:hidden">
            <h1 className="text-xl font-bold font-poppins text-white flex items-center">
              <i className="fas fa-piggy-bank mr-2 text-yellow-400"></i>
              Piglet Gambling
            </h1>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-[#36393F] rounded-full px-4 py-2">
              <i className="fas fa-coins text-yellow-400 mr-2"></i>
              {isLoading ? (
                <Skeleton className="h-5 w-20 bg-gray-700" />
              ) : (
                <span className="font-semibold">{user?.cash?.toLocaleString()}</span>
              )}
            </div>
            
            <div className="hidden md:flex items-center">
              <button 
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 transition-colors"
                onClick={() => {
                  // In a real app, this would call the daily reward API
                  fetch('/api/economy/daily', {
                    method: 'POST',
                    credentials: 'include'
                  })
                    .then(res => res.json())
                    .then(() => {
                      // Invalidate user data to reload cash amount
                      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
                    });
                }}
              >
                <i className="fas fa-plus mr-1"></i> Daily
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
