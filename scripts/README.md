# Seed Admin User

Este diretório contém scripts para criar o usuário Admin inicial do sistema.

## Credenciais Padrão

- **Email:** `admin@admin.com`
- **Senha:** `admin`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login em produção!

## Como Executar

### 1. Execute a Migration SQL

A migration `008_seed_admin.sql` cria:
- Role "Admin" com todas as permissões
- Registro de Collaborator (sem `user_id` ainda)

```bash
# Via Supabase CLI ou interface
supabase migration up
```

### 2. Execute o Script TypeScript

O script `seed-admin.ts` cria:
- Usuário Auth com email e senha
- Link entre o Collaborator e o Auth User

```bash
# Certifique-se de ter as variáveis de ambiente configuradas no .env.local:
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# ADMIN_PASSWORD (opcional, padrão: 'admin')
#
# Veja ENV_VARIABLES.md para instruções de como obter essas variáveis

npm run seed:admin
# ou
npx tsx scripts/seed-admin.ts
```

## O que cada script faz

### `008_seed_admin.sql` (Migration)
- ✅ Cria Role "Admin" 
- ✅ Cria Collaborator com email `admin@admin.com`
- ❌ NÃO cria usuário Auth (não pode fazer hash de senha em SQL puro)

### `scripts/seed-admin.ts` (TypeScript)
- ✅ Verifica se Collaborator existe
- ✅ Cria usuário Auth `admin@admin.com` / `admin`
- ✅ Linka Collaborator ao Auth User

## Deploy no Vercel

O script `post-build.js` roda automaticamente após cada build no Vercel.

**Configuração no Vercel:**
1. Vá em Settings > Environment Variables
2. Adicione as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (ou `ADMIN_ENV` para compatibilidade)
3. O script `postbuild` no `package.json` será executado automaticamente

**Nota:** O Vercel usa o comando `build:vercel` que não inclui o postbuild, então o script roda via hook `postbuild` do npm.

## Troubleshooting

**Erro: "Collaborator record not found"**
- Execute a migration `008_seed_admin.sql` primeiro

**Erro: "Missing Supabase environment variables"**
- Configure `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env` ou Vercel

**Usuário já existe mas não está linkado**
- O script detecta e faz o link automaticamente

**Erro 431 após completar signup**
- Corrigido: agora usa `window.location.href` ao invés de `router.push` para evitar problemas com cookies grandes
