# Configuração de Email de Confirmação no Supabase

## Problema

Quando um usuário se registra, recebe um email de confirmação do Supabase, mas ao clicar no link, nada acontece ou é redirecionado incorretamente.

## Solução Implementada

### 1. Página de Callback de Autenticação

Criada a rota `/auth/callback` que:
- Recebe o código de confirmação do Supabase
- Troca o código por uma sessão
- Redireciona para o dashboard após confirmação

### 2. Página de Confirmação de Email

Criada a página `/signup/confirm-email` que:
- Verifica se o email foi confirmado
- Mostra status de confirmação
- Redireciona automaticamente quando confirmado

### 3. Configuração no Supabase Dashboard

**IMPORTANTE:** Você precisa configurar as URLs de redirecionamento no Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** > **URL Configuration**
4. Adicione as seguintes URLs em **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (desenvolvimento)
   - `https://seu-dominio.com/auth/callback` (produção)
   - `http://localhost:3000/signup/confirm-email` (página de confirmação)
   - `https://seu-dominio.com/signup/confirm-email` (produção)

5. Em **Site URL**, configure:
   - Desenvolvimento: `http://localhost:3000`
   - Produção: `https://seu-dominio.com`

### 4. Configuração de Email Templates (Opcional)

O Supabase usa automaticamente o formato correto nos emails. O link de confirmação será:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

**Não é necessário modificar os templates** - o Supabase já configura isso automaticamente baseado na **Site URL** configurada.

Se você quiser personalizar o template:
1. Vá em **Authentication** > **Email Templates**
2. Edite o template **Confirm signup**
3. Use `{{ .ConfirmationURL }}` no template - ele já inclui o formato correto

## Fluxo de Confirmação

### Cenário 1: Email já confirmado (desenvolvimento)
```
Usuário se registra
  ↓
Email já confirmado (em dev, pode estar desabilitado)
  ↓
Redireciona para /dashboard
```

### Cenário 2: Email precisa ser confirmado (produção)
```
Usuário se registra
  ↓
Redireciona para /signup/confirm-email
  ↓
Usuário recebe email
  ↓
Clica no link → /auth/callback?code=xxx
  ↓
Código é trocado por sessão
  ↓
Redireciona para /dashboard
```

### Cenário 3: Usuário volta para página de confirmação
```
Usuário acessa /signup/confirm-email
  ↓
Sistema verifica se email foi confirmado
  ↓
Se sim → Redireciona para /dashboard
Se não → Mostra mensagem para verificar email
```

## Desabilitar Confirmação de Email (Apenas Desenvolvimento)

Se você quiser desabilitar a confirmação de email durante o desenvolvimento:

1. No Supabase Dashboard
2. Vá em **Authentication** > **Providers** > **Email**
3. Desabilite **Confirm email**

**⚠️ ATENÇÃO:** Nunca desabilite em produção!

## Testando

1. **Teste de Signup:**
   - Registre um novo usuário
   - Verifique se é redirecionado para `/signup/confirm-email`
   - Verifique se recebe o email

2. **Teste de Confirmação:**
   - Clique no link do email
   - Verifique se é redirecionado para `/auth/callback`
   - Verifique se depois é redirecionado para `/dashboard`

3. **Teste de Página de Confirmação:**
   - Acesse `/signup/confirm-email?email=seu@email.com`
   - Verifique se mostra o status correto

## Troubleshooting

### Link não funciona
- Verifique se a URL está configurada no Supabase Dashboard
- Verifique se o formato do link no email está correto
- Verifique os logs do Supabase para erros

### Redirecionamento incorreto
- Verifique se `/auth/callback` está excluído do middleware
- Verifique se a URL de redirecionamento está correta no Supabase

### Email não é enviado
- Verifique as configurações de email no Supabase
- Verifique se o email não está na pasta de spam
- Verifique os logs do Supabase

