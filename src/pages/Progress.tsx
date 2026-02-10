import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Target, TrendingUp, Flame, Scale } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Progress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [goalOpen, setGoalOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", target_value: "", unit: "", category: "general" });
  const [weight, setWeight] = useState("");

  const { data: goals } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: weightLogs } = useQuery({
    queryKey: ["weight-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("weight_logs").select("*").eq("user_id", user!.id).order("logged_at", { ascending: true }).limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: totalWorkouts } = useQuery({
    queryKey: ["total-workouts", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("goals").insert({
        user_id: user!.id,
        title: goalForm.title,
        target_value: parseFloat(goalForm.target_value),
        unit: goalForm.unit,
        category: goalForm.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setGoalOpen(false);
      setGoalForm({ title: "", target_value: "", unit: "", category: "general" });
      toast.success("Goal added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const logWeight = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weight_logs").insert({ user_id: user!.id, weight_kg: parseFloat(weight) });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
      setWeightOpen(false);
      setWeight("");
      toast.success("Weight logged!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const chartData = weightLogs?.map((w) => ({
    date: format(new Date(w.logged_at), "MMM d"),
    weight: Number(w.weight_kg),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your fitness journey</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1"><Scale className="h-4 w-4" /> Log Weight</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Log Weight</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); logWeight.mutate(); }} className="space-y-3">
                <Input placeholder="Weight (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={!weight || logWeight.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Goal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">New Goal</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addGoal.mutate(); }} className="space-y-3">
                <Input placeholder="Goal title" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Target value" type="number" value={goalForm.target_value} onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })} required />
                  <Input placeholder="Unit (kg, reps, km)" value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={!goalForm.title || addGoal.isPending}>Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-gym-purple mb-1" />
            <p className="text-2xl font-bold font-display">{totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">Total Workouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto text-gym-orange mb-1" />
            <p className="text-2xl font-bold font-display">🔥 0</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto text-gym-green mb-1" />
            <p className="text-2xl font-bold font-display">{goals?.filter((g) => g.completed).length || 0}</p>
            <p className="text-xs text-muted-foreground">Goals Achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Weight Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} domain={["auto", "auto"]} className="text-xs" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Goals</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {goals && goals.length > 0 ? (
            goals.map((g) => {
              const pct = g.target_value ? Math.min((Number(g.current_value) / Number(g.target_value)) * 100, 100) : 0;
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{g.title}</p>
                    <span className="text-xs text-muted-foreground">{Number(g.current_value)}/{Number(g.target_value)} {g.unit}</span>
                  </div>
                  <ProgressBar value={pct} className="h-2" />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No goals yet. Set your first goal!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
