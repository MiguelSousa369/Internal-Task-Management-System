# Sistema Interno de Gestão de Tarefas — Backend

API REST para gestão e acompanhamento de pedidos de suporte recebidos por telefone, email ou presencialmente. Substitui o canal Teams como ferramenta de registo.

---

## Stack

| Tecnologia | Função |
|---|---|
| Node.js + TypeScript | Runtime e tipagem |
| Express 5 | Framework HTTP |
| Prisma 7 | ORM |
| PostgreSQL | Base de dados |
| Zod 4 | Validação de inputs |
| JWT | Autenticação |
| bcryptjs | Hash de passwords |
| Winston | Logging |
| Helmet + CORS | Segurança |
| Swagger UI | Documentação interativa da API |

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+

---

## Instalação

```bash
cd backend
npm install
```

---

## Configuração

Copia o ficheiro de exemplo e preenche os valores:

```bash
cp .env.example .env
```

Edita o `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/task_management?schema=public"
JWT_SECRET="uma_string_longa_aleatoria_e_segura"
PORT=3000
```

Opcionais (ver `.env.example`):

| Variável | Por omissão | Função |
|---|---|---|
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origens permitidas por CORS (separadas por vírgula) |
| `TRUST_PROXY` | `false` | `true` atrás de um reverse proxy (o Caddy em produção) |
| `RATE_LIMIT_MAX` | `2000` | Pedidos por IP a cada 15 minutos |
| `LOGIN_RATE_LIMIT_MAX` | `20` | Logins falhados por IP a cada 15 minutos |
| `SESSION_HOURS` | `24` | A sessão expira ao fim destas horas sem uso |

Em produção (`NODE_ENV=production`) a API recusa arrancar sem `JWT_SECRET`.

---

## Base de Dados

### Criar e migrar a base de dados

```bash
npx prisma migrate dev --name init
```

### Criar o primeiro administrador

Na instalação com Docker o `deploy/setup` já cria o `admin` (ver [docs/deploy.md](../docs/deploy.md)).
À mão, usa este comando para criar um utilizador Admin:

```bash
ADMIN_NOME="Administrador" ADMIN_USERNAME="admin" ADMIN_PASSWORD="supersecret" npm run create-admin
```

Com `-- --if-empty` só cria o Admin se ainda não houver nenhum utilizador. O script valida que os três campos estão presentes, que a password tem mínimo 6 caracteres, e que o username ainda não existe na base de dados. Após criar o Admin, podes criar os restantes utilizadores através da aplicação.

### Popular com dados de exemplo (apenas desenvolvimento)

```bash
npx prisma db seed
```

Este comando cria dados de teste. **Não usar em produção.**

| Role | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| Técnico | joao | joao123 |
| Técnico | pedro | pedro123 |
| Rececionista | recepcao | recepcao123 |

---

## Arrancar o servidor

```bash
npm run dev
```

O servidor fica disponível em `http://localhost:3000`.

A documentação Swagger fica disponível em `http://localhost:3000/api-docs`.

### Produção

Em produção corre em Docker (`backend/Dockerfile`, usado por `deploy/docker-compose.yml`): a imagem
compila o TypeScript (`npm run build`) e, ao arrancar, aplica as migrações pendentes
(`prisma migrate deploy`) antes de iniciar a API (`npm start`). Ver
[docs/deploy.md](../docs/deploy.md).

---

## Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma       # Modelos da base de dados
│   ├── seed.ts             # Dados de exemplo
│   ├── createAdmin.ts      # Criação de um Admin (npm run create-admin)
│   └── migrations/         # Migrações do Prisma (versionadas; aplicadas em produção)
├── src/
│   ├── controllers/        # Recebem o request, validam, chamam o service
│   ├── routes/             # Definição de endpoints e middlewares por rota
│   ├── services/           # Lógica de negócio e acesso à BD via Prisma
│   ├── schemas/            # Schemas Zod para validação de inputs
│   ├── middlewares/        # authGuard, roleGuard, errorHandler, logger
│   ├── lib/                # Instâncias partilhadas (prisma, swagger)
│   ├── utils/              # Logger Winston
│   ├── docs/               # Ficheiros YAML para Swagger UI
│   └── server.ts           # Ponto de entrada da aplicação
├── logs/                   # Logs gerados automaticamente
├── Dockerfile              # Imagem de produção
├── .env.example
├── package.json
├── tsconfig.json
└── prisma.config.ts
```

---

## Arquitetura

O projeto segue uma arquitetura em camadas:

```
Request → Route → Middleware (auth/role) → Controller → Service → Prisma → PostgreSQL
                                               ↓
                                         Validação Zod
                                               ↓
                                         Error Handler
```

- **Routes**: definem os endpoints, aplicam middlewares de autenticação e permissões
- **Controllers**: validam o input com Zod, extraem dados do request, delegam ao service
- **Services**: contêm toda a lógica de negócio e interagem com a BD via Prisma
- **Middlewares**: `authGuard` verifica o JWT, `roleGuard` verifica permissões por role

---

## Autenticação

Todas as rotas (exceto `/api/auth/login` e `/api/health`) requerem autenticação via JWT.

O token é obtido no login e deve ser enviado em todas as chamadas seguintes:

```http
Authorization: Bearer <token>
```

### Sessões

A sessão **renova-se automaticamente** enquanto a app está a ser usada e só expira ao fim de
**24 horas sem uso** (`SESSION_HOURS`):

- O token do login é válido por `SESSION_HOURS`.
- Em cada pedido autenticado com um token com mais de 15 minutos, a API devolve um token novo no
  header `X-Session-Token`; o frontend guarda-o e passa a usá-lo. Quem tem a app aberta (a lista
  atualiza a cada 5 segundos) nunca fica sem sessão.
- O `authGuard` confirma em cada pedido que o utilizador existe e está ativo, e usa o perfil da base
  de dados: desativar alguém ou mudar-lhe o perfil tem efeito imediato.
- Token inválido ou expirado, ou utilizador desativado → `401 Sessão expirada`.

O login aceita no máximo 20 tentativas falhadas por IP a cada 15 minutos.

---

## Roles e Permissões

O perfil **TV** é para um ecrã na parede (modo TV no frontend): só tem acesso a `GET /api/tasks` e
`GET /api/dashboard`. Qualquer outro pedido dá `403`.

| Ação | Admin | Técnico | Rececionista |
|---|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ |
| Ver tarefas | ✅ | ✅ | ✅ |
| Criar tarefa | ✅ | ✅ | ✅ |
| Adicionar comentário | ✅ | ✅ | ✅ |
| Editar comentário próprio | ✅ | ✅ | ✅ |
| Apagar comentário próprio | ✅ | ✅ | ✅ |
| Apagar comentário de outros | ✅ | ❌ | ❌ |
| Alterar prioridade | ✅ | ✅ | ✅ |
| Assumir tarefa | ✅ | ✅ | ❌ |
| Libertar tarefa | ✅ | ✅ | ❌ |
| Editar tarefa | ✅ | ✅ | ❌ |
| Concluir tarefa | ✅ | ✅ | ❌ |
| Reabrir tarefa | ✅ | ✅ | ❌ |
| Eliminar tarefa | ✅ | ❌ | ❌ |
| Gerir utilizadores | ✅ | ❌ | ❌ |
| Dashboard / Stats | ✅ | ✅ | ✅ |

---

## Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login → devolve token JWT |

### Utilizadores

| Método | Endpoint | Roles | Descrição |
|---|---|---|---|
| GET | `/api/users/tecnicos` | Todos | Listar técnicos ativos (id + nome) |
| GET | `/api/users` | Admin | Listar todos os utilizadores |
| GET | `/api/users/:id` | Admin | Detalhe do utilizador |
| POST | `/api/users` | Admin | Criar utilizador |
| PUT | `/api/users/:id` | Admin | Editar utilizador |
| DELETE | `/api/users/:id` | Admin | Desativar utilizador |

### Tarefas

| Método | Endpoint | Roles | Descrição |
|---|---|---|---|
| GET | `/api/tasks` | Todos | Listar tarefas (com filtros) |
| GET | `/api/tasks/:id` | Todos | Detalhe + comentários |
| POST | `/api/tasks` | Todos | Criar tarefa |
| PUT | `/api/tasks/:id` | Técnico, Admin | Editar dados da tarefa |
| PUT | `/api/tasks/:id/start` | Técnico, Admin | Assumir tarefa |
| PUT | `/api/tasks/:id/release` | Técnico, Admin | Libertar tarefa |
| PUT | `/api/tasks/:id/priority` | Todos | Alterar prioridade |
| PUT | `/api/tasks/:id/complete` | Técnico, Admin | Concluir tarefa |
| PUT | `/api/tasks/:id/reopen` | Técnico, Admin | Reabrir tarefa concluída |
| DELETE | `/api/tasks/:id` | Admin | Eliminar tarefa |

### Comentários

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/tasks/:id/comments` | Listar comentários |
| POST | `/api/tasks/:id/comments` | Adicionar comentário |
| PUT | `/api/tasks/:id/comments/:commentId` | Editar comentário (só o autor; preenche `editadoEm`) |
| DELETE | `/api/tasks/:id/comments/:commentId` | Apagar comentário (autor ou Admin) |

### Estado

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Verificação de saúde (sem autenticação) — usado pelo deploy |

### Dashboard (Admin only)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/dashboard` | Contadores gerais (abertas, urgentes, etc.) |
| GET | `/api/stats` | Ranking de produtividade por técnico |

---

## Filtros em GET /api/tasks

Os filtros podem ser combinados (lógica AND):

```
GET /api/tasks?estado=Novo
GET /api/tasks?prioridade=Urgente
GET /api/tasks?emTratamentoPor=2
GET /api/tasks?search=primavera
GET /api/tasks?estado=EmTratamento&prioridade=Alta
```

As tarefas são ordenadas por **prioridade descendente** (Urgente → Normal) e depois por **data de criação ascendente**.

---

## Estados das Tarefas

```
Novo ──────────── start ──────────► EmTratamento ──── complete ──► Concluido
  ▲                                      │                              │
  └──────────── release ──────────────────┘                             │
  └──────────────────────────── reopen ────────────────────────────────┘
```

| Estado | Descrição |
|---|---|
| `Novo` | Pedido registado, sem técnico responsável |
| `EmTratamento` | Técnico atribuído, trabalho em curso |
| `Concluido` | Pedido resolvido |

**Regras de transição:**
- `/start`: qualquer técnico pode assumir (inclusive se já tem responsável — o último a clicar fica)
- `/release`: remove o responsável e volta a `Novo`
- `/reopen`: só funciona em tarefas `Concluido` — volta a `Novo` sem responsável

---

## Respostas de Erro

Todos os erros seguem o mesmo formato:

```json
{
  "success": false,
  "status": 400,
  "error": "Dados inválidos",
  "timestamp": "2026-06-02T10:00:00.000Z",
  "fields": ["titulo", "cliente"]
}
```

O campo `fields` só aparece em erros de validação (Zod).

---

## Logs

Os logs são escritos automaticamente na pasta `logs/`:

- `logs/error.log` — erros (status 500+)
- `logs/combined.log` — todos os pedidos
- Console — output simplificado durante desenvolvimento

---

## Comandos Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Compilar e correr a versão compilada
npm run build
npm start

# Visualizar a base de dados no browser
npx prisma studio

# Gerar cliente Prisma após alterar o schema
npx prisma generate

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Fazer reset completo da BD e re-seed
npx prisma migrate reset
```
