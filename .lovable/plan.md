## Sistema de Agenda e Reuniões

Módulo novo "Agenda" com calendário mensal estilo Notion, gestão de reuniões e confirmação de participação por assinatura digital.

### Como vai funcionar

**Para a Gestora (você):**
- Calendário mensal navegável (mês atual + meses arquivados via seletor de data)
- Clicar em qualquer dia → painel lateral com reuniões daquele dia ou "Nenhuma reunião agendada"
- Botão "Agendar reunião" abre formulário com:
  - Título
  - Horário
  - Link da reunião
  - Seleção de participantes (clica nos perfis da equipe)
- Após criar: pode editar título/horário/link/participantes a qualquer momento ANTES de finalizar
- Aparece botão "Finalizar reunião" + campo obrigatório "Pauta" (o que foi passado/estabelecido)
- Sem pauta preenchida → não finaliza
- Ao finalizar: bloqueia edição e libera assinatura para os participantes
- Quando TODOS os participantes assinarem → aparece "Reunião concluída" com ícone de cadeado 🔒 na sua visão
- Indicador visual de quem já assinou e quem falta (para cobrar)

**Para Colaboradoras/Supervisoras (visão idêntica entre si):**
- Só veem na agenda as reuniões em que foram selecionadas como participantes
- Não conseguem editar nada
- Antes de finalizada: veem os detalhes (título, horário, link, participantes)
- Após finalizada pela gestora: veem a pauta + bloco de assinatura:
  > "Eu, [campo nome], concordo que participei da reunião realizada em [data], fui apresentado(a) a todas as informações, diretrizes e responsabilidades discutidas, e estou ciente de que o não cumprimento do que foi estabelecido poderá resultar em penalidades internas ou medidas legais cabíveis."
- Preenchem o nome e clicam em "Enviar assinatura" → não pode mais editar

**Arquivamento automático:**
- Reuniões de meses anteriores ficam acessíveis via seletor de mês/ano no topo do calendário
- Nada é deletado, só fica em histórico navegável

### Detalhes técnicos

**Banco de dados (2 tabelas novas):**

`meetings`
- id, title, meeting_date, meeting_time, meeting_link
- agenda (texto da pauta, preenchido na finalização)
- participants (array de uuids dos profiles)
- status: `scheduled` | `finalized` | `completed`
- created_by, created_by_name
- finalized_at, completed_at

`meeting_signatures`
- id, meeting_id, user_id, user_name, signed_name, signed_at
- unique(meeting_id, user_id)

**Regras de acesso (RLS):**
- Gestora: vê e gerencia tudo
- Outros usuários: SELECT só quando `auth.uid() = ANY(participants)`
- Assinatura: INSERT só pelo próprio usuário e só se reunião estiver `finalized` e ele for participante
- Edição de reunião: só gestora, e só quando status = `scheduled`

**Trigger automático:**
- Quando uma nova assinatura é inserida → conta total de assinaturas vs. participantes → se igual, atualiza status para `completed` automaticamente (zero risco de inconsistência)

**UI (`src/components/modules/AgendaModule.tsx`):**
- Header com navegação de mês (← Mês Atual →) + seletor "Ir para mês..."
- Grid de calendário 7 colunas com badges por dia: 🔵 agendada, 🟢 finalizada (aguardando assinaturas), 🔒 concluída
- Painel lateral (Sheet) ao clicar no dia
- Dialog de criação/edição (apenas gestora)
- Card de assinatura para participantes não-gestoras

**Sidebar:** adicionar item "Agenda" no menu

### Garantias de robustez
- Validação dupla (cliente + RLS no banco) — impossível ver reunião que não foi convidado
- Status do banco controla o fluxo, não estado local
- Trigger garante que "concluída" só aparece quando todos assinaram
- Datas armazenadas como `date` puro (sem timezone) — não somem nem mudam
- Realtime opcional para atualização instantânea quando alguém assina
