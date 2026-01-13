# Variáveis de Ambiente

Este documento descreve as variáveis de ambiente necessárias para executar a aplicação.

## Variáveis Obrigatórias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
# Esses valores podem ser encontrados nas configurações do seu projeto Supabase:
# 1. Acesse https://supabase.com/dashboard
# 2. Selecione seu projeto
# 3. Vá em Settings > API
# 4. Copie o "Project URL" e a chave "anon public"

# URL do seu projeto Supabase
# Exemplo: https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Chave anon/public do Supabase
# Esta chave é segura para expor no navegador (é pública)
# Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Chave service_role do Supabase (APENAS para scripts server-side)
# ⚠️ NUNCA exponha esta chave no frontend!
# Esta chave tem privilégios administrativos completos
# Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Senha do usuário Admin inicial (opcional, padrão: 'admin')
# ⚠️ Em produção, SEMPRE defina uma senha forte!
# Esta variável é usada pelo script de seed para criar/atualizar o admin
ADMIN_PASSWORD=your_secure_admin_password
# Nota: ADMIN_ENV também é aceito para compatibilidade
```

## Como Obter as Variáveis

### 1. Criar um Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados do projeto (nome, senha do banco, região)
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter as Credenciais

1. No dashboard do Supabase, selecione seu projeto
2. Vá em **Settings** (Configurações) no menu lateral
3. Clique em **API**
4. Na seção **Project API keys**, você encontrará:
   - **Project URL**: Use este valor para `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Use este valor para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret): Use este valor para `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ Esta chave é SECRETA e só deve ser usada em scripts server-side
     - ⚠️ NUNCA exponha esta chave no frontend ou no código do cliente

### 3. Criar o Arquivo .env.local

1. Na raiz do projeto, crie um arquivo chamado `.env.local`
2. Copie o conteúdo do exemplo acima
3. Substitua `your_supabase_project_url` e `your_supabase_anon_key` pelos valores reais do seu projeto

## Exemplo de Arquivo .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PASSWORD=YourSecurePassword123!
```

## Importante

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git (ele já está no `.gitignore`)
- ✅ A chave `anon public` é segura para usar no frontend (ela é pública por design)
- ⚠️ A chave `service_role` é SECRETA e só deve ser usada em scripts server-side
- ✅ O arquivo `.env.local` é carregado automaticamente pelo Next.js
- ✅ Após criar o arquivo, reinicie o servidor de desenvolvimento (`npm run dev`)
- ✅ Para scripts como `seed-admin.ts`, as variáveis são carregadas automaticamente do `.env.local`
- ✅ No Vercel, configure `ADMIN_PASSWORD` nas variáveis de ambiente do projeto
- ✅ O script `post-build.js` roda automaticamente após cada build no Vercel para garantir que o admin existe

## Verificação

Para verificar se as variáveis estão configuradas corretamente:

1. Inicie o servidor: `npm run dev`
2. Acesse http://localhost:3000
3. Tente fazer login ou criar uma conta
4. Se houver erros relacionados ao Supabase, verifique se as variáveis estão corretas


