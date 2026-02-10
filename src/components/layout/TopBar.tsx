import { Bell, Menu, Moon, Sun, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 md:hidden">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold">Gym Pro</span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <Avatar className="h-8 w-8 md:hidden cursor-pointer">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
