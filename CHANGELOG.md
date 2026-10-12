# Changelog

Alterações relevantes à Gestão de Tarefas. As versões seguem
[Semantic Versioning](https://semver.org/lang/pt-PT/).

## [Unreleased]

### Produção
- Instalação em Docker ao estilo dos outros projetos: `deploy/` com Docker Compose (PostgreSQL,
  API, Caddy) e `setup.sh` (Linux) / `setup.ps1` (Windows), que geram as passwords, arrancam
  tudo, criam o primeiro admin e garantem o arranque automático.
- HTTPS na rede interna, por IP, com a autoridade de certificação do Caddy; o certificado raiz é
  servido em `http://<endereço>/ca.crt` para instalar nos PCs.
- `import-db.sh` / `import-db.ps1`: importa uma base de dados existente (ex.: a instalação antiga
  em modo de desenvolvimento), com cópia de segurança e reposição automática se falhar.
- Guia de instalação em [docs/deploy.md](docs/deploy.md).

### Backend
- Perfil **TV** (só visualização): acesso apenas a `GET /api/tasks` e `GET /api/dashboard`
  (migração `role_tv`).
- O contentor do backend corre à hora de Portugal (`TZ=Europe/Lisbon`): "concluídas hoje" e as
  estatísticas deixam de contar o dia em UTC.
- `GET /api/users/tecnicos` passa a exigir um dos perfis de trabalho (não o TV).
- Sessões com renovação automática: o token dura 24 horas (`SESSION_HOURS`) e é renovado (header
  `X-Session-Token`) enquanto a app está a ser usada - deixa de cair a meio do dia de trabalho.
- Desativar um utilizador ou mudar-lhe o perfil tem efeito imediato (o `authGuard` confirma-o na
  base de dados); sessão inválida ou expirada passa a dar `401`.
- Editar comentários: `PUT /api/tasks/:id/comments/:commentId` (só o autor); novo campo
  `editadoEm` (migração `comentario_editado`).
- Apagar comentários: `DELETE /api/tasks/:id/comments/:commentId` (o autor ou um Admin).
- `GET /api/health`.
- Limite de 20 logins falhados por IP a cada 15 minutos; limite geral configurável
  (`RATE_LIMIT_MAX`, 2000 por omissão).
- Configuração por ambiente: `FRONTEND_ORIGIN` (CORS), `TRUST_PROXY`; recusa arrancar em produção
  sem `JWT_SECRET`.
- `npm run build` / `npm start`; `create-admin --if-empty`.
- As migrações do Prisma passam a estar no repositório (necessárias para `migrate deploy`).

### Frontend
- **Modo TV** para um ecrã na parede: ecrã inteiro, letra grande, contadores do dia, hora e data;
  atualiza a cada 5 segundos e passa as páginas sozinho. Dois layouts à escolha — **Grelha**
  (cartões aumentados para encher o ecrã) e **Colunas** (Urgentes / Novas / Em Tratamento, com a
  largura para quem tem mais tarefas) — e o número de cartões ajustável; fica guardado no browser.
  Abre pelo botão na navbar, em `/#tv`, ou direto com um utilizador de perfil TV.
- Quando a sessão expira, a app volta ao login com o aviso "A sessão expirou" (antes ficava a dar
  erros até se carregar em Sair).
- Editar e apagar observações no detalhe da tarefa (marcadas como "editado").
- Design mais sóbrio: ícones SVG (lucide-react) em vez de emojis, botões e badges sólidos, sem
  animações contínuas, ecrã de login simplificado, ícones na navegação.
- Fonte Inter incluída na aplicação (deixa de depender do Google Fonts) e favicon.
- Corrigido: as cores dos badges de estado e a borda dos cards não apareciam (classes removidas pelo
  Tailwind no build).
- Corrigido: um Técnico ao abrir uma tarefa recebia um erro 403 e não via a lista de técnicos ao
  editar.
- Notificação do browser quando chega uma tarefa nova.
- A API é chamada no próprio endereço (`/api`): o Caddy encaminha em produção e o Vite em
  desenvolvimento.

## [1.0.0] — 2026-06-08

Primeira versão, em uso interno.

- Tarefas com cliente, contacto, descrição, prioridade (Normal / Urgente), técnico solicitado e
  responsável; estados Novo → Em Tratamento → Concluído, com libertar e reabrir.
- Comentários por tarefa.
- Perfis Admin, Técnico e Rececionista, com login por username e JWT.
- Lista de tarefas por secções, com pesquisa, filtros e atualização automática a cada 5 segundos.
- Dashboard, estatísticas por técnico e gestão de utilizadores.
- Documentação da API em Swagger (`/api-docs`).
