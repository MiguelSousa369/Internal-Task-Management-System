# Sistema Interno de Gestão de Tarefas — Frontend

Interface web para gestão e acompanhamento de pedidos de suporte. Consome a API REST do backend.

---

## Stack

| Tecnologia | Função |
|---|---|
| React 19 + TypeScript | UI e tipagem |
| Vite 8 | Dev server e build |
| Tailwind CSS 3 | Estilização |
| Fetch API | Chamadas ao backend |

---

## Pré-requisitos

- Node.js 20+
- Backend a correr em `http://localhost:3000`

---

## Instalação

```bash
cd frontend
npm install
```

---

## Arrancar

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

---

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── api/
│   │   └── api.ts          # Todas as chamadas ao backend (fetch)
│   ├── components/
│   │   ├── Login.tsx       # Página de login (ecrã completo)
│   │   ├── Navbar.tsx      # Barra de navegação fixa no topo
│   │   ├── TaskCard.tsx    # Card de tarefa com cor por prioridade
│   │   ├── TaskDetail.tsx  # Modal com detalhe, ações e comentários
│   │   ├── CreateTask.tsx  # Modal de criação de pedido
│   │   └── ConfirmModal.tsx # Modal de confirmação genérico
│   ├── views/
│   │   ├── TasksView.tsx       # Lista principal de tarefas
│   │   ├── DashboardView.tsx   # Indicadores gerais (Admin)
│   │   ├── StatsView.tsx       # Ranking de produtividade (Admin)
│   │   └── UsersView.tsx       # Gestão de utilizadores (Admin)
│   ├── App.tsx             # Root: autenticação e routing por estado
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind + estilos globais + animações
├── tailwind.config.js      # Tema com cores Litinfor
├── vite.config.ts
└── index.html
```

---

## Autenticação

Sem autenticação, o utilizador vê apenas a página de login.

Após login bem-sucedido, o token JWT e os dados do utilizador ficam guardados em `localStorage`. Todas as chamadas à API enviam o token no header `Authorization: Bearer <token>`.

---

## Routing

Não usa React Router. A navegação é feita por estado interno no `App.tsx`:

| View | Quem vê |
|---|---|
| `tasks` | Todos (vista por defeito) |
| `dashboard` | Admin |
| `stats` | Admin |
| `users` | Admin |

---

## Vistas

### Tarefas (`tasks`)
Lista principal organizada em secções colapsáveis:

| Secção | Conteúdo |
|---|---|
| 🔥 Urgentes | Tarefas com prioridade Urgente não concluídas — sempre no topo |
| 📥 Novas | Tarefas sem responsável (exceto Urgentes) |
| 🔧 Em Tratamento | Tarefas com técnico atribuído (exceto Urgentes) |
| ✅ Concluídas | Oculta por defeito — clicar para expandir |

Inclui pesquisa com debounce e filtros por estado e prioridade (combinados com AND).

### Dashboard (`dashboard`) — Admin
Cinco contadores em tempo real: tarefas abertas, urgentes, sem responsável, em tratamento e concluídas hoje.

### Estatísticas (`stats`) — Admin
Ranking de técnicos por tarefas concluídas hoje e no mês corrente.

### Utilizadores (`users`) — Admin
Tabela de utilizadores com criação, edição e desativação.

---

## Cores (tema Litinfor)

| Nome | Hex | Uso |
|---|---|---|
| `primary-600` | `#5b068c` | Botão principal, navbar ativa, badges Normal |
| `accent-500` | `#ff5e00` | Botão "Novo Pedido", border cards Urgente |

---

## Permissões por Role

| Ação | Admin | Técnico | Rececionista |
|---|:---:|:---:|:---:|
| Ver tarefas | ✅ | ✅ | ✅ |
| Criar pedido | ✅ | ✅ | ✅ |
| Adicionar comentário | ✅ | ✅ | ✅ |
| Alterar prioridade | ✅ | ✅ | ✅ |
| Assumir / Libertar | ✅ | ✅ | ❌ |
| Editar tarefa | ✅ | ✅ | ❌ |
| Concluir / Reabrir | ✅ | ✅ | ❌ |
| Eliminar tarefa | ✅ | ❌ | ❌ |
| Dashboard / Stats | ✅ | ❌ | ❌ |
| Gerir utilizadores | ✅ | ❌ | ❌ |

---

## Build para produção

```bash
npm run build
```

Os ficheiros gerados ficam em `dist/` e podem ser servidos por qualquer servidor estático (Nginx, Apache, etc.).
