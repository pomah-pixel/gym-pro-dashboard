import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Dumbbell, CalendarDays, Apple, TrendingUp, Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/nutrition", icon: Apple, label: "Diet" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/ai-coach", icon: MessageSquare, label: "AI" },
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
      <div className="flex justify-around py-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-0.5 min-w-0">
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px]", active ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
