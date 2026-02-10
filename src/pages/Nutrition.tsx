import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Apple } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

export default function Nutrition() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [form, setForm] = useState({ meal_name: "", meal_type: "lunch", calories: "", protein_g: "", carbs_g: "", fats_g: "" });

  const { data: todayMeals } = useQuery({
    queryKey: ["today-meals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user!.id)
        .gte("logged_at", startOfDay(today).toISOString())
        .lte("logged_at", endOfDay(today).toISOString())
        .order("logged_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: nutritionGoals } = useQuery({
    queryKey: ["nutrition-goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data || { daily_calories: 2000, daily_protein_g: 150, daily_carbs_g: 250, daily_fats_g: 65 };
    },
    enabled: !!user,
  });

  const addMeal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meals").insert({
        user_id: user!.id,
        meal_name: form.meal_name,
        meal_type: form.meal_type,
        calories: parseInt(form.calories) || 0,
        protein_g: parseFloat(form.protein_g) || 0,
        carbs_g: parseFloat(form.carbs_g) || 0,
        fats_g: parseFloat(form.fats_g) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-meals"] });
      setOpen(false);
      setForm({ meal_name: "", meal_type: "lunch", calories: "", protein_g: "", carbs_g: "", fats_g: "" });
      toast.success("Meal logged!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = todayMeals?.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + Number(m.protein_g || 0),
      carbs: acc.carbs + Number(m.carbs_g || 0),
      fats: acc.fats + Number(m.fats_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const macros = [
    { label: "Calories", value: totals.calories, goal: nutritionGoals?.daily_calories || 2000, unit: "kcal", color: "bg-gym-orange" },
    { label: "Protein", value: totals.protein, goal: Number(nutritionGoals?.daily_protein_g) || 150, unit: "g", color: "bg-gym-purple" },
    { label: "Carbs", value: totals.carbs, goal: Number(nutritionGoals?.daily_carbs_g) || 250, unit: "g", color: "bg-gym-blue" },
    { label: "Fats", value: totals.fats, goal: Number(nutritionGoals?.daily_fats_g) || 65, unit: "g", color: "bg-gym-pink" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Nutrition</h1>
          <p className="text-muted-foreground text-sm">{format(today, "EEEE, MMMM d")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Log Meal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Log Meal</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addMeal.mutate(); }} className="space-y-3">
              <Input placeholder="Meal name" value={form.meal_name} onChange={(e) => setForm({ ...form, meal_name: e.target.value })} required />
              <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Calories" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
                <Input placeholder="Protein (g)" type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Carbs (g)" type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
                <Input placeholder="Fats (g)" type="number" value={form.fats_g} onChange={(e) => setForm({ ...form, fats_g: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={!form.meal_name || addMeal.isPending}>
                {addMeal.isPending ? "Saving..." : "Log Meal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Macro Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macros.map(({ label, value, goal, unit, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-bold font-display">{Math.round(value)}<span className="text-sm text-muted-foreground font-normal">/{goal}{unit}</span></p>
              <Progress value={Math.min((value / goal) * 100, 100)} className="h-2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Today's Meals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {todayMeals && todayMeals.length > 0 ? (
            todayMeals.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-xl bg-gym-green/10 flex items-center justify-center">
                  <Apple className="h-5 w-5 text-gym-green" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.meal_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.meal_type} · {format(new Date(m.logged_at), "h:mm a")}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{m.calories} kcal</p>
                  <p>P:{Number(m.protein_g)}g C:{Number(m.carbs_g)}g F:{Number(m.fats_g)}g</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No meals logged today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
