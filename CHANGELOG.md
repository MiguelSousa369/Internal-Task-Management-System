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
- Apagar comentários: `DELETE /api/tasks/:id/comments/:commentId` (o autor ou um Admin).
- `GET /api/health`.
- Limite de 20 logins falhados por IP a cada 15 minutos; limite geral configurável
  (`RATE_LIMIT_MAX`, 2000 por omissão).
- Configuração por ambiente: `FRONTEND_ORIGIN` (CORS), `TRUST_PROXY`; recusa arrancar em produção
  sem `JWT_SECRET`.
- `npm run build` / `npm start`; `create-admin --if-empty`.
- As migrações do Prisma passam a estar no repositório (necessárias para `migrate deploy`).

### Frontend
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
