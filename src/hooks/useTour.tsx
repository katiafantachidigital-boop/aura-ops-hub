import { createContext, useContext, useCallback, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/hooks/useAuth";

interface TourStep {
  route: string;
  selector: string;
  title: string;
  description: string;
  managerOnly?: boolean;
  supervisorOrManagerOnly?: boolean;
}

const ALL_STEPS: TourStep[] = [
  {
    route: "/",
    selector: '[data-tour="header-title"]',
    title: "Bem-vindo(a)! 👋",
    description:
      "Este é um passo a passo rápido pelo sistema. Use os botões para avançar, voltar ou sair a qualquer momento.",
  },
  {
    route: "/",
    selector: '[data-tour="sidebar-dashboard"]',
    title: "Dashboard",
    description:
      "A visão geral da clínica: indicadores, ações rápidas e atividades recentes ficam aqui.",
  },
  {
    route: "/checklist",
    selector: '[data-tour="sidebar-checklist"]',
    title: "Checklist Diário",
    description:
      "Supervisoras e gestoras enviam aqui o checklist do dia. Cada envio gera pontuação para a equipe.",
    supervisorOrManagerOnly: true,
  },
  {
    route: "/caixa",
    selector: '[data-tour="sidebar-caixa"]',
    title: "Caixa",
    description:
      "Registre o fechamento do caixa do dia, separando por forma de pagamento.",
    supervisorOrManagerOnly: true,
  },
  {
    route: "/goals-race",
    selector: '[data-tour="sidebar-goals-race"]',
    title: "Pontuação",
    description:
      "Acompanhe o progresso da equipe rumo à meta do mês.",
  },
  {
    route: "/sales-goals",
    selector: '[data-tour="sidebar-sales-goals"]',
    title: "Metas de Vendas",
    description:
      "Visualize a evolução das vendas frente às metas mínima, intermediária e máxima.",
  },
  {
    route: "/sales-registration",
    selector: '[data-tour="sidebar-sales-registration"]',
    title: "Registrar Venda",
    description:
      "Registre vendas que você realizou. Cada venda soma pontos no seu ranking.",
  },
  {
    route: "/ranking",
    selector: '[data-tour="sidebar-ranking"]',
    title: "Ranking",
    description:
      "Classificação mensal da equipe baseada em pontos de checklist, vendas e treinamentos.",
  },
  {
    route: "/training",
    selector: '[data-tour="sidebar-training"]',
    title: "Treinamentos",
    description:
      "Conteúdos de capacitação. Conclua para ganhar pontos. Treinamentos da sua área pontuam em dobro.",
  },
  {
    route: "/announcements",
    selector: '[data-tour="sidebar-announcements"]',
    title: "Comunicados",
    description:
      "Avisos e recados importantes. Selos vermelhos indicam novidades não lidas.",
  },
  {
    route: "/occurrences",
    selector: '[data-tour="sidebar-occurrences"]',
    title: "Ocorrências",
    description:
      "Registre ocorrências internas e troque mensagens com a gestão.",
  },
  {
    route: "/spreadsheets",
    selector: '[data-tour="sidebar-spreadsheets"]',
    title: "Planilhas",
    description:
      "Crie e gerencie planilhas estilo Excel diretamente no sistema.",
  },
  {
    route: "/team",
    selector: '[data-tour="sidebar-team"]',
    title: "Equipe",
    description: "Gerencie sua equipe de profissionais.",
    managerOnly: true,
  },
  {
    route: "/supervisor",
    selector: '[data-tour="sidebar-supervisor"]',
    title: "Supervisora",
    description: "Defina as supervisoras responsáveis pelas operações.",
    managerOnly: true,
  },
  {
    route: "/checklist-history",
    selector: '[data-tour="sidebar-checklist-history"]',
    title: "Histórico de Checklists",
    description: "Consulte e confirme checklists anteriores.",
    managerOnly: true,
  },
  {
    route: "/feedback-history",
    selector: '[data-tour="sidebar-feedback-history"]',
    title: "Histórico de Avaliações",
    description: "Veja todas as avaliações enviadas pelas clientes.",
    managerOnly: true,
  },
  {
    route: "/settings",
    selector: '[data-tour="sidebar-settings"]',
    title: "Configurações",
    description: "Ajustes gerais do sistema.",
    managerOnly: true,
  },
  {
    route: "/profile",
    selector: '[data-tour="sidebar-profile"]',
    title: "Meu Perfil",
    description:
      "Seu perfil profissional, com pontuação, treinamentos e o botão para reabrir este passo a passo quando quiser.",
  },
];

interface TourContextType {
  startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_STORAGE_KEY = "tour-completed-v1";

export function TourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, isManager, canSubmitChecklist, isProfileComplete, loading } = useAuth();
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<TourStep[]>([]);
  const indexRef = useRef(0);
  const autoStartedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  const waitForElement = (selector: string, timeout = 3000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeout) return resolve(null);
        requestAnimationFrame(check);
      };
      check();
    });
  };

  const showStep = useCallback(
    async (idx: number) => {
      const steps = stepsRef.current;
      if (idx < 0 || idx >= steps.length) {
        cleanup();
        try {
          localStorage.setItem(TOUR_STORAGE_KEY, "1");
        } catch {}
        return;
      }
      indexRef.current = idx;
      const step = steps[idx];

      // Navigate if needed
      if (window.location.pathname !== step.route) {
        navigate(step.route);
      }

      const el = await waitForElement(step.selector);

      if (driverRef.current) {
        driverRef.current.destroy();
      }

      const isFirst = idx === 0;
      const isLast = idx === steps.length - 1;

      driverRef.current = driver({
        showProgress: true,
        progressText: `${idx + 1} de ${steps.length}`,
        nextBtnText: isLast ? "Concluir" : "Próximo →",
        prevBtnText: "← Voltar",
        doneBtnText: "Concluir",
        showButtons: ["next", "previous", "close"],
        allowClose: true,
        overlayOpacity: 0.5,
        onDestroyed: () => {
          try {
            localStorage.setItem(TOUR_STORAGE_KEY, "1");
          } catch {}
        },
      });

      driverRef.current.highlight({
        element: (el as HTMLElement) || undefined,
        popover: {
          title: step.title,
          description: step.description,
          showButtons: ["next", "previous", "close"],
          onNextClick: () => showStep(idx + 1),
          onPrevClick: () => {
            if (isFirst) return;
            showStep(idx - 1);
          },
          onCloseClick: () => {
            cleanup();
            try {
              localStorage.setItem(TOUR_STORAGE_KEY, "1");
            } catch {}
          },
        },
      });
    },
    [cleanup, navigate]
  );

  const buildSteps = useCallback((): TourStep[] => {
    return ALL_STEPS.filter((s) => {
      if (s.managerOnly && !isManager) return false;
      if (s.supervisorOrManagerOnly && !canSubmitChecklist) return false;
      return true;
    });
  }, [isManager, canSubmitChecklist]);

  const startTour = useCallback(() => {
    stepsRef.current = buildSteps();
    indexRef.current = 0;
    showStep(0);
  }, [buildSteps, showStep]);

  // Auto-start once for new users
  useEffect(() => {
    if (loading || !user || !isProfileComplete || autoStartedRef.current) return;
    let completed: string | null = null;
    try {
      completed = localStorage.getItem(`${TOUR_STORAGE_KEY}-${user.id}`);
    } catch {}
    if (!completed) {
      autoStartedRef.current = true;
      // Slight delay so layout mounts
      const t = setTimeout(() => {
        stepsRef.current = buildSteps();
        indexRef.current = 0;
        showStep(0);
        try {
          localStorage.setItem(`${TOUR_STORAGE_KEY}-${user.id}`, "1");
        } catch {}
      }, 800);
      return () => clearTimeout(t);
    }
  }, [user, isProfileComplete, loading, buildSteps, showStep]);

  useEffect(() => () => cleanup(), [cleanup]);

  return <TourContext.Provider value={{ startTour }}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
