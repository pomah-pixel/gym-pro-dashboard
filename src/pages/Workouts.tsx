import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Dumbbell, Clock, Flame } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Workouts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ exercise_name: "", sets: "", reps: "", weight_kg: "", duration_minutes: "", calories_burned: "", notes: "" });

  const { data: workouts } = useQuery({
    queryKey: ["workouts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("*").order("name");
      return data || [];
    },
  });

  const addWorkout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workouts").insert({
        user_id: user!.id,
        exercise_name: form.exercise_name,
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        calories_burned: form.calories_burned ? parseInt(form.calories_burned) : 0,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-workouts"] });
      setOpen(false);
      setForm({ exercise_name: "", sets: "", reps: "", weight_kg: "", duration_minutes: "", calories_burned: "", notes: "" });
      toast.success("Workout logged!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredExercises = exercises?.filter((e) => filter === "all" || e.category === filter) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Workouts</h1>
          <p className="text-muted-foreground text-sm">Track your exercises and progress</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Log Workout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Log Workout</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addWorkout.mutate(); }} className="space-y-3">
              <Select value={form.exercise_name} onValueChange={(v) => setForm({ ...form, exercise_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select exercise" /></SelectTrigger>
                <SelectContent>
                  {exercises?.map((ex) => (
                    <SelectItem key={ex.id} value={ex.name}>{ex.name} ({ex.category})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Sets" type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
                <Input placeholder="Reps" type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
                <Input placeholder="Weight (kg)" type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Duration (min)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
                <Input placeholder="Calories" type="number" value={form.calories_burned} onChange={(e) => setForm({ ...form, calories_burned: e.target.value })} />
              </div>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button type="submit" className="w-full" disabled={!form.exercise_name || addWorkout.isPending}>
                {addWorkout.isPending ? "Saving..." : "Log Workout"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exercise Categories */}
      <div className="flex gap-2 flex-wrap">
        {["all", "strength", "cardio", "flexibility"].map((cat) => (
          <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)} className="capitalize">
            {cat}
          </Button>
        ))}
      </div>

      {/* Exercise Browse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filteredExercises.slice(0, 8).map((ex) => (
          <Card key={ex.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setForm({ ...form, exercise_name: ex.name }); setOpen(true); }}>
            <CardContent className="p-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{ex.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{ex.muscle_group}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workout History */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Recent Workouts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {workouts && workouts.length > 0 ? (
            workouts.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{w.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.sets && `${w.sets}×${w.reps}`}{w.weight_kg && ` @ ${w.weight_kg}kg`}
                    {w.duration_minutes && ` · ${w.duration_minutes}min`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {w.calories_burned > 0 && (
                    <div className="flex items-center gap-1 text-gym-orange text-xs"><Flame className="h-3 w-3" />{w.calories_burned}</div>
                  )}
                  <p className="text-xs text-muted-foreground">{format(new Date(w.completed_at), "MMM d")}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No workouts logged yet. Start tracking!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
