import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Profile from "@/pages/Profile";
import Games from "@/pages/Games";
import Leaderboard from "@/pages/Leaderboard";
import Help from "@/pages/Help";
import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Profile} />
        <Route path="/profile" component={Profile} />
        <Route path="/games" component={Games} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
