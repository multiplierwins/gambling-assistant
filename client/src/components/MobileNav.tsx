import { Link } from "wouter";

interface MobileNavProps {
  currentPage: string;
}

export default function MobileNav({ currentPage }: MobileNavProps) {
  const navItems = [
    { id: "profile", label: "Profile", icon: "user-circle" },
    { id: "games", label: "Games", icon: "dice" },
    { id: "shop", label: "Shop", icon: "shopping-cart" },
    { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
    { id: "help", label: "Help", icon: "question-circle" },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#202225] z-10">
      <div className="flex justify-around p-3">
        {navItems.map(item => (
          <Link key={item.id} href={`/${item.id === 'profile' ? '' : item.id}`}>
            <a className={`flex flex-col items-center ${
              currentPage === item.id ? 'text-blue-500' : 'text-[#B9BBBE]'
            }`}>
              <i className={`fa fa-${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
