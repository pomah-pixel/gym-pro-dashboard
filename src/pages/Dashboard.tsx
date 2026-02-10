import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Target, TrendingUp, Plus, Apple, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const statCards = [
  { label: "Workouts This Week", icon: Dumbbell, color: "bg-gym-purple/10 text-gym-purple", key: "workouts" },
  { label: "Current Streak", icon: Flame, color: "bg-gym-orange/10 text-gym-orange", key: "streak" },
  { label: "Calories Burned", icon: TrendingUp, color: "bg-gym-green/10 text-gym-green", key: "calories" },
  { label: "Active Goals", icon: Target, color: "bg-gym-pink/10 text-gym-pink", key: "goals" },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const { data: weeklyWorkouts } = useQuery({
    queryKey: ["weekly-workouts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workouts")
        .select("completed_at, calories_burned")
        .eq("user_id", user!.id)
        .gte("completed_at", weekStart.toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  const { data: activeGoals } = useQuery({
    queryKey: ["active-goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", user!.id)
        .eq("completed", false);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ["upcoming-sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scheduled_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("scheduled_at", today.toISOString())
        .eq("completed", false)
        .order("scheduled_at", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Build chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = format(day, "EEE");
    const count = weeklyWorkouts?.filter(
      (w) => format(new Date(w.completed_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    ).length || 0;
    return { day: dayStr, workouts: count, isToday: isToday(day) };
  });

  const totalWorkouts = weeklyWorkouts?.length || 0;
  const totalCalories = weeklyWorkouts?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;

  const statValues: Record<string, number | string> = {
    workouts: totalWorkouts,
    streak: "🔥 0",
    calories: totalCalories.toLocaleString(),
    goals: activeGoals?.length || 0,
  };

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const sessionTypeColors: Record<string, string> = {
    strength: "bg-gym-purple",
    cardio: "bg-gym-orange",
    yoga: "bg-gym-green",
    flexibility: "bg-gym-blue",
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Champion"} 💪
        </h1>
        <p className="text-muted-foreground">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, icon: Icon, color, key }, i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">{statValues[key]}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions && upcomingSessions.length > 0 ? (
              upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`h-2 w-2 rounded-full ${sessionTypeColors[s.session_type] || "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.scheduled_at), "MMM d, h:mm a")}
                      {s.trainer_name && ` · ${s.trainer_name}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/workouts")}>
          <Plus className="h-5 w-5 text-gym-purple" />
          <span className="text-xs">Log Workout</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/nutrition")}>
          <Apple className="h-5 w-5 text-gym-green" />
          <span className="text-xs">Add Meal</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/calendar")}>
          <CalendarDays className="h-5 w-5 text-gym-blue" />
          <span className="text-xs">Schedule</span>
        </Button>
      </div>
    </div>
  );
}
