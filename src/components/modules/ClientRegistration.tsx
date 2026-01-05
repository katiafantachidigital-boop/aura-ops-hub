import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Users, X, History, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  registered_by_name: string;
  sale_participants: string[];
  created_at: string;
}

export function ClientRegistration() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [participant, setParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    if (participant.trim() && !participants.includes(participant.trim())) {
      setParticipants([...participants, participant.trim()]);
      setParticipant("");
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setParticipants([]);
    setParticipant("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    if (!user || !profile) {
      toast.error("Você precisa estar logado");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("clients").insert({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
        registered_by: user.id,
        registered_by_name: profile.full_name || "Usuário",
        sale_participants: participants,
      });

      if (error) throw error;

      toast.success("Cliente cadastrado com sucesso!");
      resetForm();
      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error("Error registering client:", error);
      toast.error("Erro ao cadastrar cliente: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cadastro de Clientes</h2>
          <p className="text-muted-foreground">Registre novos clientes e acompanhe o histórico</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cliente *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Participantes da Venda (Comissão)</Label>
                <div className="flex gap-2">
                  <Input
                    value={participant}
                    onChange={(e) => setParticipant(e.target.value)}
                    placeholder="Nome do participante"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addParticipant())}
                  />
                  <Button type="button" variant="outline" onClick={addParticipant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {participants.map((p) => (
                      <Badge key={p} variant="secondary" className="gap-1">
                        {p}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeParticipant(p)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                {submitting ? "Cadastrando..." : "Cadastrar Cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente cadastrado ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Cadastrado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.phone && <div>{client.phone}</div>}
                          {client.email && <div className="text-muted-foreground">{client.email}</div>}
                          {!client.phone && !client.email && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {client.sale_participants?.length > 0 ? (
                            client.sale_participants.map((p) => (
                              <Badge key={p} variant="outline" className="text-xs">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client.registered_by_name}</TableCell>
                      <TableCell>
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes do Cliente</DialogTitle>
                            </DialogHeader>
                            {selectedClient && (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-muted-foreground">Nome</Label>
                                  <p className="font-medium">{selectedClient.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-muted-foreground">Telefone</Label>
                                    <p>{selectedClient.phone || "-"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">E-mail</Label>
                                    <p>{selectedClient.email || "-"}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Participantes da Venda</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedClient.sale_participants?.length > 0 ? (
                                      selectedClient.sale_participants.map((p) => (
                                        <Badge key={p} variant="secondary">
                                          {p}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-muted-foreground">Nenhum participante</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Observações</Label>
                                  <p>{selectedClient.notes || "Sem observações"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                  <div>
                                    <Label className="text-muted-foreground">Cadastrado por</Label>
                                    <p>{selectedClient.registered_by_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Data</Label>
                                    <p>
                                      {format(new Date(selectedClient.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                        locale: ptBR,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
