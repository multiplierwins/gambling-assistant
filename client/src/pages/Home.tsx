import { useEffect } from "react";
import { useLocation } from "wouter";

// Home page that automatically redirects to the profile page
export default function Home() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to profile page
    setLocation("/profile");
  }, [setLocation]);
  
  return null;
}
