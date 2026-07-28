# Chá de Panela de Ryan e Juliana

Site completo para convite, lista de presentes, reservas e administração do Chá de Panela de Ryan e Juliana.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Postgres com Prisma ORM
- Rotas de API para reserva e CRUD
- Pronto para deploy na Vercel

## Funcionalidades

- Página pública com convite, data, horário, local e WhatsApp.
- Lista de presentes com busca e separação entre disponíveis e reservados.
- Reserva pública com validação de nome e bloqueio de duplicidade no banco.
- Admin em `/admin` protegido por `ADMIN_PASSWORD`.
- Admin com busca, filtros, criação, edição, remoção de presentes e cancelamento de reservas.
- Seed inicial baseado em `cha_panela_presentes.csv` e regras/dados de `cha_panela_dados_crud.json`.

## Variáveis de ambiente

Crie um arquivo `.env` com:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
ADMIN_PASSWORD="uma-senha-forte"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Para Vercel, configure as mesmas variáveis em **Project Settings > Environment Variables**. Em Neon, use a URL pooled em `DATABASE_URL` e a URL direta/unpooled em `DATABASE_URL_UNPOOLED`.

## Rodando localmente

Instale dependências:

```bash
npm install
```

Suba um Postgres local com Docker:

```bash
docker compose up -d postgres
```

Aplique a migration:

```bash
npm run db:migrate
```

Popule os presentes e reservas iniciais:

```bash
npm run db:seed
```

Para sincronizar a lista de presentes em um banco já publicado sem apagar reservas existentes:

```bash
npm run db:sync-gifts
```

Rode o site:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Usando Neon

1. Crie um banco Postgres no Neon.
2. Copie a connection string.
3. Defina `DATABASE_URL` e `DATABASE_URL_UNPOOLED` no `.env` local e na Vercel.
4. Rode:

```bash
npm run db:deploy
npm run db:seed
```

Em produção, rode o seed apenas quando quiser popular ou reiniciar a lista inicial.
Para atualizar somente os presentes sem remover reservas, use `npm run db:sync-gifts`.

## Deploy na Vercel

1. Envie o projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `ADMIN_PASSWORD` e `NEXT_PUBLIC_SITE_URL`.
4. Use o comando de build padrão:

```bash
npm run build
```

5. Depois do deploy, aplique migrations com:

```bash
npm run db:deploy
```

Se preferir, rode o seed localmente apontando para o banco Neon.

## Dados e regras

- `cha_panela_dados_crud.json` é a fonte principal para regras, avisos, Pix e estado de reserva quando houver conflito.
- `cha_panela_presentes.csv` é usado como fonte da lista inicial de presentes.
- A lista original não possui coluna de categoria. O seed infere categorias editáveis a partir do nome do presente para habilitar filtros no admin e na página pública.
- O formulário público pede nome e sobrenome. O schema suporta WhatsApp e mensagem opcionais em reservas, mas esses campos não são exigidos porque não aparecem nos arquivos originais.

## Banco

Tabelas principais:

- `presentes`
- `reservas`

Garantias:

- `reservas.presente_id` é único.
- A reserva pública usa transação.
- O status do presente só muda para reservado se ele ainda estiver disponível.
- Cancelar reserva no admin remove a reserva e libera o presente na mesma transação.

## Validação

Checklist recomendado:

```bash
npm run build
npm run db:migrate
npm run db:seed
npm run dev
```

No site público:

- Buscar um presente disponível.
- Reservar usando nome e sobrenome.
- Tentar reservar o mesmo presente novamente e confirmar mensagem de conflito.

No admin:

- Entrar em `/admin` com `ADMIN_PASSWORD`.
- Filtrar por disponíveis/reservados.
- Adicionar, editar e remover um presente de teste.
- Cancelar uma reserva e confirmar que o item volta para disponíveis.
