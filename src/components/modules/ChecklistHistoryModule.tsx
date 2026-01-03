import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, ClipboardCheck, User, Clock, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistEntry {
  id: string;
  date: string;
  time: string;
  supervisor: string;
  supervisorAvatar: string;
  shift: "Manhã" | "Tarde" | "Noite";
  status: "complete" | "incomplete" | "late";
  itemsCompleted: number;
  totalItems: number;
  criticalIssues: number;
}

const checklistHistory: ChecklistEntry[] = [
  { id: "1", date: "02/01/2025", time: "08:15", supervisor: "Carla Mendes", supervisorAvatar: "CM", shift: "Manhã", status: "complete", itemsCompleted: 25, totalItems: 25, criticalIssues: 0 },
  { id: "2", date: "01/01/2025", time: "08:30", supervisor: "Carla Mendes", supervisorAvatar: "CM", shift: "Manhã", status: "late", itemsCompleted: 25, totalItems: 25, criticalIssues: 0 },
  { id: "3", date: "31/12/2024", time: "08:05", supervisor: "Juliana Santos", supervisorAvatar: "JS", shift: "Manhã", status: "complete", itemsCompleted: 24, totalItems: 25, criticalIssues: 1 },
  { id: "4", date: "30/12/2024", time: "14:10", supervisor: "Patricia Lima", supervisorAvatar: "PL", shift: "Tarde", status: "incomplete", itemsCompleted: 20, totalItems: 25, criticalIssues: 2 },
  { id: "5", date: "29/12/2024", time: "08:00", supervisor: "Juliana Santos", supervisorAvatar: "JS", shift: "Manhã", status: "complete", itemsCompleted: 25, totalItems: 25, criticalIssues: 0 },
  { id: "6", date: "28/12/2024", time: "08:20", supervisor: "Carla Mendes", supervisorAvatar: "CM", shift: "Manhã", status: "complete", itemsCompleted: 25, totalItems: 25, criticalIssues: 0 },
  { id: "7", date: "27/12/2024", time: "14:00", supervisor: "Ana Oliveira", supervisorAvatar: "AO", shift: "Tarde", status: "complete", itemsCompleted: 23, totalItems: 25, criticalIssues: 0 },
];

const supervisors = ["Todos", "Carla Mendes", "Juliana Santos", "Patricia Lima", "Ana Oliveira"];

const statusConfig = {
  complete: { label: "Completo", color: "bg-emerald-light text-emerald", icon: CheckCircle2 },
  incomplete: { label: "Incompleto", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  late: { label: "Atrasado", color: "bg-gold-light text-gold", icon: Clock },
};

export function ChecklistHistoryModule() {
  const [searchDate, setSearchDate] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("Todos");

  const filteredHistory = checklistHistory.filter(entry => {
    const matchesDate = !searchDate || entry.date.includes(searchDate);
    const matchesSupervisor = selectedSupervisor === "Todos" || entry.supervisor === selectedSupervisor;
    return matchesDate && matchesSupervisor;
  });

  const totalComplete = checklistHistory.filter(e => e.status === "complete").length;
  const totalLate = checklistHistory.filter(e => e.status === "late").length;
  const totalIncomplete = checklistHistory.filter(e => e.status === "incomplete").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat" className="p-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-light text-emerald">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completos</p>
              <p className="text-2xl font-bold">{totalComplete}</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-light text-gold">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atrasados</p>
              <p className="text-2xl font-bold">{totalLate}</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incompletos</p>
              <p className="text-2xl font-bold">{totalIncomplete}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por data (ex: 02/01)"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por responsável" />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map(sup => (
                  <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Histórico de Checklists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum checklist encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredHistory.map((entry, index) => {
                const status = statusConfig[entry.status];
                const StatusIcon = status.icon;
                const completionRate = Math.round((entry.itemsCompleted / entry.totalItems) * 100);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${500 + index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Date */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-background border">
                        <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-bold">{entry.date.split("/")[0]}</span>
                        <span className="text-[10px] text-muted-foreground">{entry.date.split("/")[1]}/{entry.date.split("/")[2]}</span>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{entry.supervisor}</span>
                          <Badge variant="outline" className="text-[10px]">{entry.shift}</Badge>
                          <Badge className={cn("text-[10px]", status.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.time}
                          </span>
                          <span>{entry.itemsCompleted}/{entry.totalItems} itens ({completionRate}%)</span>
                          {entry.criticalIssues > 0 && (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {entry.criticalIssues} problemas críticos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
