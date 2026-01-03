import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Loader2 } from "lucide-react";
import { parse, isValid, format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  birth_date: z.string()
    .min(10, "Data de nascimento é obrigatória")
    .refine((val) => {
      const parsed = parse(val, "dd/MM/yyyy", new Date());
      return isValid(parsed);
    }, "Data inválida. Use o formato DD/MM/AAAA")
    .refine((val) => {
      const parsed = parse(val, "dd/MM/yyyy", new Date());
      return parsed <= new Date() && parsed >= new Date("1940-01-01");
    }, "Data deve estar entre 1940 e hoje"),
  shift: z.enum(["Manhã", "Tarde"], {
    required_error: "Selecione um turno",
  }),
  role: z.string().min(1, "Selecione uma função"),
  custom_role: z.string().optional(),
}).refine((data) => {
  if (data.role === "Outro") {
    return data.custom_role && data.custom_role.length >= 2;
  }
  return true;
}, {
  message: "Especifique a função",
  path: ["custom_role"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const roleOptions = [
  "Fisioterapia",
  "Estética",
  "Recepção",
  "Serviços Gerais",
  "Outro",
];

export function ProfileOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      shift: undefined,
      role: "",
      custom_role: "",
    },
  });

  const selectedRole = form.watch("role");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5, 9);
    }
    
    form.setValue("birth_date", value);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalRole = data.role === "Outro" ? data.custom_role : data.role;
      const parsedDate = parse(data.birth_date, "dd/MM/yyyy", new Date());
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name.trim(),
          birth_date: format(parsedDate, "yyyy-MM-dd"),
          shift: data.shift,
          role: finalRole,
          custom_role: data.role === "Outro" ? data.custom_role : null,
          profile_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      
      // Refresh the profile to trigger redirect
      await refreshProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
            <CardDescription className="mt-2">
              Preencha seus dados para acessar o sistema. Todos os campos são obrigatórios.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Nome Completo */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu nome completo" 
                        {...field} 
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DD/MM/AAAA"
                        value={field.value || ""}
                        onChange={handleDateChange}
                        maxLength={10}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Turno */}
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno de Trabalho</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="manha"
                          className={cn(
                            "flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                            field.value === "Manhã"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value="Manhã" id="manha" className="sr-only" />
                          <span className="font-medium">☀️ Manhã</span>
                        </Label>
                        <Label
                          htmlFor="tarde"
                          className={cn(
                            "flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                            field.value === "Tarde"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value="Tarde" id="tarde" className="sr-only" />
                          <span className="font-medium">🌙 Tarde</span>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Função */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione sua função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo personalizado para "Outro" */}
              {selectedRole === "Outro" && (
                <FormField
                  control={form.control}
                  name="custom_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especifique sua função</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite sua função" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar e Continuar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}