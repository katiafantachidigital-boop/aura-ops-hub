import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users,
  Star,
  Loader2,
  Crown,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  custom_role: string | null;
  shift: string | null;
  is_supervisor: boolean | null;
  profile_completed: boolean;
  clinic: string | null;
}

const clinicLabels: Record<string, string> = {
  capao_raso: "Capão Raso",
  batel: "Batel",
};

export function TeamModule() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingClinic, setUpdatingClinic] = useState<string | null>(null);
  const { isManager } = useAuth();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_completed', true)
      .order('full_name');

    setProfiles(data || []);
    setLoading(false);
  };

  const handleClinicChange = async (profileId: string, clinic: string) => {
    if (!isManager) return;
    
    setUpdatingClinic(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ clinic: clinic === "none" ? null : clinic })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.id === profileId ? { ...p, clinic: clinic === "none" ? null : clinic } : p
      ));
      
      toast.success("Clínica atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating clinic:", error);
      toast.error("Erro ao atualizar clínica");
    } finally {
      setUpdatingClinic(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getShiftLabel = (shift: string | null) => {
    const shifts: Record<string, string> = {
      morning: "Manhã",
      afternoon: "Tarde",
      full: "Integral"
    };
    return shift ? shifts[shift] || shift : "Não definido";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">
            {profiles.length === 0 
              ? "Nenhum profissional cadastrado ainda" 
              : `${profiles.length} ${profiles.length === 1 ? 'profissional cadastrado' : 'profissionais cadastrados'}`
            }
          </p>
        </div>
      </div>

      {/* Empty State */}
      {profiles.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">Nenhuma colaboradora cadastrada</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Quando as colaboradoras criarem suas contas e completarem o perfil, 
                elas aparecerão aqui automaticamente
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Team Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map((member) => (
            <Card key={member.id} variant="interactive" className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {getInitials(member.full_name)}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {member.full_name || "Sem nome"}
                        {member.is_supervisor && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {member.custom_role || member.role || "Colaborador"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={member.is_supervisor ? "bg-amber-100 text-amber-700" : "bg-emerald-light text-emerald"}>
                    {member.is_supervisor ? "Supervisora" : "Ativa"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="text-sm text-muted-foreground">{getShiftLabel(member.shift)}</span>
                  </div>
                </div>

                {/* Clinic Selector - Only visible to manager */}
                {isManager && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Clínica</span>
                    </div>
                    <Select
                      value={member.clinic || "none"}
                      onValueChange={(value) => handleClinicChange(member.id, value)}
                      disabled={updatingClinic === member.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não definida</SelectItem>
                        <SelectItem value="capao_raso">Capão Raso</SelectItem>
                        <SelectItem value="batel">Batel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show clinic badge for non-managers */}
                {!isManager && member.clinic && (
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {clinicLabels[member.clinic] || member.clinic}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
