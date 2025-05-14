import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  currentPage: string;
  user: any;
}

export default function Sidebar({ currentPage, user }: SidebarProps) {
  const sidebarItems = [
    { id: "profile", label: "Profile", icon: "user-circle" },
    { id: "games", label: "Games", icon: "dice" },
    { id: "shop", label: "Shop", icon: "shopping-cart" },
    { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
    { id: "help", label: "Help", icon: "question-circle" },
    { id: "mine", label: "Crypto Mine", icon: "hammer" }
  ];
  
  return (
    <div className="hidden md:flex flex-col w-64 bg-[#202225]">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-2xl font-bold font-poppins text-white flex items-center">
          <i className="fas fa-piggy-bank mr-3 text-yellow-400"></i>
          Piglet Gambling
        </h1>
      </div>
      
      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {sidebarItems.map(item => (
            <li key={item.id}>
              <Link href={`/${item.id === 'profile' ? '' : item.id}`}>
                <a 
                  className={`sidebar-item flex items-center px-4 py-3 text-[#B9BBBE] hover:bg-gray-700 hover:text-white rounded-lg mx-2 transition-all ${
                    currentPage === item.id ? 'active' : ''
                  }`}
                >
                  <i className={`fa fa-${item.icon} w-6`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          {/* A Discord-style user avatar */}
          <Avatar className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            <AvatarFallback>
              {user?.username?.slice(0, 2).toUpperCase() || "JD"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-white font-medium">
              {user?.username || "User#0000"}
            </p>
            <p className="text-xs text-[#B9BBBE]">
              Level {user?.level || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
