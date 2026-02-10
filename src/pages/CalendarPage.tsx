import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";

export default function CalendarPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", session_type: "strength", scheduled_at: "", duration_minutes: "60", trainer_name: "", notes: "" });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scheduled_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("scheduled_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const addSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scheduled_sessions").insert({
        user_id: user!.id,
        title: form.title,
        session_type: form.session_type,
        scheduled_at: form.scheduled_at,
        duration_minutes: parseInt(form.duration_minutes),
        trainer_name: form.trainer_name || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      setOpen(false);
      setForm({ title: "", session_type: "strength", scheduled_at: "", duration_minutes: "60", trainer_name: "", notes: "" });
      toast.success("Session scheduled!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session removed");
    },
  });

  const daySessions = sessions?.filter((s) => isSameDay(new Date(s.scheduled_at), selectedDate)) || [];
  const typeColors: Record<string, string> = { strength: "bg-gym-purple", cardio: "bg-gym-orange", yoga: "bg-gym-green", flexibility: "bg-gym-blue" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm">Schedule & manage sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Session</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Schedule Session</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addSession.mutate(); }} className="space-y-3">
              <Input placeholder="Session title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Duration (min)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
                <Input placeholder="Trainer (optional)" value={form.trainer_name} onChange={(e) => setForm({ ...form, trainer_name: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={!form.title || !form.scheduled_at || addSession.isPending}>
                {addSession.isPending ? "Saving..." : "Schedule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{
                hasSession: sessions?.map((s) => new Date(s.scheduled_at)) || [],
              }}
              modifiersClassNames={{ hasSession: "bg-primary/20 font-bold" }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-lg">{format(selectedDate, "EEEE, MMMM d")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {daySessions.length > 0 ? (
              daySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`h-3 w-3 rounded-full ${typeColors[s.session_type] || "bg-primary"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.scheduled_at), "h:mm a")} · {s.duration_minutes}min
                      {s.trainer_name && ` · ${s.trainer_name}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSession.mutate(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No sessions on this day</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
