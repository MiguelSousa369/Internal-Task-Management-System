# Gestão de Tarefas

Sistema interno para registar e acompanhar os pedidos de suporte que chegam por telefone, email ou
presencialmente — substitui o canal do Teams como ferramenta de registo. Cada pedido tem cliente,
contacto, prioridade (Normal / Urgente), técnico responsável e comentários.

<p align="center">
  <a href="#produção">Produção</a> &middot;
  <a href="docs/deploy.md">Guia de instalação</a> &middot;
  <a href="#desenvolvimento">Desenvolvimento</a> &middot;
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## O que faz

- **Tarefas** — lista por secções (Urgentes, Novas, Em Tratamento, Concluídas), pesquisa e filtros,
  atualização automática a cada 5 segundos e notificação do browser quando chega um pedido novo.
- **Fluxo** — qualquer técnico assume um pedido, liberta-o ou conclui-o; um pedido concluído pode
  ser reaberto.
- **Comentários** — contexto e notas de cada pedido; o autor pode editá-los e o autor ou um Admin
  podem apagá-los.
- **Dashboard e estatísticas** — contadores do dia e ranking de técnicos.
- **Modo TV** — para um ecrã na parede: ecrã inteiro, letra grande, colunas Urgentes / Novas / Em
  Tratamento e contadores do dia, a atualizar sozinho. Um utilizador com perfil TV só vê isto.
- **Utilizadores** — perfis Admin, Técnico, Rececionista e TV (só visualização), geridos pelo
  Admin.

## Arquitetura

```
backend/   API REST (Node.js, Express, Prisma, PostgreSQL)
frontend/  Interface web (React, Vite, Tailwind)
deploy/    Produção (Docker Compose + Caddy) e scripts de instalação
docs/      Guia de instalação
```

```
browsers (rede interna) ──HTTPS 443──► Caddy ──► frontend + /api ──► backend ──► PostgreSQL
                                       (única coisa exposta)                     (só interno)
```

## Produção

Corre em Docker num servidor da rede interna (Linux ou Windows) e acede-se pelo IP, em HTTPS com
um certificado da autoridade interna do Caddy. Sem passwords por defeito.

```sh
# Linux
git clone https://github.com/MiguelSousa369/Internal-Task-Management-System.git
cd Internal-Task-Management-System/deploy
./setup.sh
```

```powershell
# Windows com Docker Desktop
git clone https://github.com/MiguelSousa369/Internal-Task-Management-System.git
cd Internal-Task-Management-System\deploy
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

O script pergunta o endereço (sugere o IP do servidor), gera as passwords, arranca tudo, oferece
importar uma base de dados existente e cria o utilizador `admin` se ainda não houver nenhum. No
fim mostra o link e, se criou o admin, a password.

Em cada PC, uma vez, é preciso confiar no certificado (senão o browser avisa e as notificações
não funcionam) — o comando aparece no fim do setup. Tudo isto, mais atualizar, backups e
resolução de problemas: **[docs/deploy.md](docs/deploy.md)**.

## Desenvolvimento

Precisa de Node.js 20+ e de um PostgreSQL. Dois terminais (detalhes no README de cada pasta):

```sh
# backend/ — API em http://localhost:3000 (Swagger em /api-docs)
cp .env.example .env          # DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npx prisma db seed            # opcional: dados de exemplo
npm run dev

# frontend/ — http://localhost:5173 (o Vite encaminha /api para o backend)
npm install
npm run dev
```

Mais: [backend/README.md](backend/README.md) (API, permissões, base de dados),
[frontend/README.md](frontend/README.md) (vistas, componentes, cores).
