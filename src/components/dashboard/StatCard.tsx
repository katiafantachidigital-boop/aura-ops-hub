import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: "emerald" | "rose" | "gold" | "lavender";
  delay?: number;
}

const iconColors = {
  emerald: "bg-emerald-light text-emerald",
  rose: "bg-rose-gold-light text-rose-gold-dark",
  gold: "bg-gold-light text-gold",
  lavender: "bg-lavender text-lavender-dark",
};

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  iconColor,
  delay = 0 
}: StatCardProps) {
  return (
    <Card 
      variant="stat" 
      className="p-6 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-emerald",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconColors[iconColor])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
