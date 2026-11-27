# ZapiObra — Gestão de Obras (Piloto PST Construtora)

Gestão de obras com entrada operacional pelo WhatsApp e conferência financeira em painel administrativo privado.

---

## 1. Mapa Operacional do Projeto

| Componente | Configuração / Destino Verificado | Administração | Fonte da Informação | Status em Produção |
| :--- | :--- | :--- | :--- | :--- |
| **Produto** | ZapiObra (Piloto: PST Construtora) | Equipe ZapiObra / PST | `README.md`, `docs/status-atual.md` | Ativo |
| **Pasta de Trabalho** | `C:\Users\Utilizador\Documents\Antigravity-Workspace\ZapiObra` | Local (Worktree isolado para PR) | Sistema de arquivos local | Validado |
| **Repositório Git** | `https://github.com/tidilodo/SENDOBRA` | GitHub (`origin`) | Git remote | Ativo |
| **Branch de Trabalho** | `consolidacao-zapiobra` (base: `origin/main` @ `17de4f9`) | GitHub / Git | Git log / PR #11 integrado | Em revisão |
| **Painel Oficial** | `https://zapiobra-admin.vercel.app/entrar` | Vercel (`deployment/admin-app`) | `docs/status-atual.md` | **Confirmado em produção** |
| **Demonstração** | `https://zapiobra.vercel.app/` | Vercel (`deployment/vercel-app` / demo) | `deployment/admin-app/app/entrar/page.tsx` | Ativo |
| **Autenticação** | Supabase Auth (`https://kciwsyoebypthsnzraup.supabase.co/auth/v1`) | Painel Supabase / Sessão local AES-GCM | `deployment/admin-app/lib/session.mjs` | Ativo |
| **Backend API** | Cloudflare Workers / Sites | Cloudflare Dashboard / Wrangler | `app/api/data/route.ts`, `docs/architecture.md` | Ativo |
| **Proxy Upstream** | `https://sendobra-pst.bergsonchatgpt.chatgpt.site` | Vercel Server Route (`/api/[...path]`) | `deployment/admin-app/app/api/[...path]/route.ts` | **Evidência no código (a confirmar em migração)** |
| **Banco de Dados** | Cloudflare D1 (`env.DB`, SQLite distribuído) | Cloudflare D1 | `app/api/data/route.ts`, `docs/data-model.md` | Ativo |
| **Armazenamento** | Cloudflare R2 (`env.BUCKET`, comprovantes privados) | Cloudflare R2 | `app/api/data/route.ts` | Ativo |
| **Geolocalização** | Vercel Blob (`@vercel/blob`, raio e mapa de obras) | Vercel Blob Storage | `deployment/admin-app/lib/project-locations-service.mjs` | Ativo |
| **WhatsApp Ingestão** | Evolution Go Webhook -> Cloudflare Worker | Instância Evolution Go | `app/api/whatsapp/route.ts`, `docs/evolution-webhook.md` | Ativo |
| **Publicação** | Vercel (Next.js) + Cloudflare Workers (CI GitHub Actions) | GitHub Actions `.github/workflows/verify.yml` | Workflows do repositório | Ativo |

> **Nota sobre endereços legados:** As URLs `admin.sendobra.zroprojects.com.br` e `demo.sendobra.zroprojects.com.br` constavam no README original (05/11/2026). São evidências de documentação antiga substituídas operacionalmente pelos domínios oficiais na Vercel (`zapiobra-admin.vercel.app`).

---

## 2. Dependências Ativas com Nome SendObra

Antes de qualquer ação de limpeza de nomes legados, foi verificado que as seguintes referências são **dependências funcionais ativas** do sistema e devem ser preservadas nesta etapa:

1. **Cabeçalhos HTTP de Assinatura HMAC (Webhooks e Bridge):**
   - `x-sendobra-timestamp` e `x-sendobra-signature` (validação de webhook em `app/api/whatsapp/route.ts` e testes de integração).
   - `x-sendobra-bridge-timestamp` e `x-sendobra-bridge-signature` (ponte entre Vercel e Worker em `app/api/vercel-bridge/route.ts`).
2. **Upstream do Proxy Administrativo:**
   - A rota de proxy reverso da Vercel (`deployment/admin-app/app/api/[...path]/route.ts`) valida estritamente a origem:
     `upstream.origin === 'https://sendobra-pst.bergsonchatgpt.chatgpt.site'`. Qualquer alteração sem apontamento no Cloudflare gera erro 503.
3. **Formato do Backup Criptografado:**
   - Identificador `sendobra-snapshot-v1` em `lib/backup.mjs` e testes de restauração de snapshot.
4. **Variáveis de Ambiente e Automações:**
   - `SENDOBRA_SITE_URL`, `SENDOBRA_RECOVERY_ENABLED`, `SENDOBRA_INGESTION_CRON_SECRET` em `adapter/` e nos workflows do GitHub.

---

## 3. Superadmin e "Editar Nome da Obra" (PR #11)

A consolidação incorpora nativamente o **PR #11** (commits `2236367` e `17de4f9` integrados à `main`), sem reaplicação de patches.

### Verificações Arquiteturais
- **Autorização no Servidor:** A função `canRenameProject` em `app/api/data/route.ts` exige cumulativamente:
  `user.role === 'owner' && user.id === env.ZAPIOBRA_SUPERADMIN_USER_ID`.
- **Auditoria:** Toda alteração de nome grava registro imutável na tabela `audit`:
  `await log(u, 'project.rename', id, before, { ...before, name }).run()`.
- **Preservação de Vínculos:** As obras são referenciadas em lançamentos (`records.project`), mensagens (`whatsapp_messages`), comprovantes e geolocalização pelo seu identificador primário `id` imutável. A alteração de `projects.name` preserva 100% dos vínculos e do histórico financeiro.

### Procedimento para Habilitar a Conta `sos.alquimia@gmail.com`
*(Não executar em produção nesta etapa — documentação de referência para a fase de ativação)*:
1. Obter o identificador `id` da conta na tabela `users` do Cloudflare D1:
   ```sql
   SELECT id, name, email, role, active FROM users WHERE email = 'sos.alquimia@gmail.com';
   ```
2. Garantir que o usuário possua cargo de proprietário ativo:
   ```sql
   UPDATE users SET role = 'owner', active = 1 WHERE email = 'sos.alquimia@gmail.com';
   ```
3. Configurar a variável de ambiente secreta no Cloudflare Workers:
   ```bash
   npx wrangler secret put ZAPIOBRA_SUPERADMIN_USER_ID
   # Informar o id obtido no passo 1
   ```

---

## 4. Estado da Operação da PST

- **Obra ativa:** `OBRA PST VALIDACAO REAL` é a única obra ativa no painel oficial.
- **Obras arquivadas:** `PILOTO · Teste WhatsApp — sem dados reais` e `DEMONSTRAÇÃO · Residência Horizonte (fictícia)`.
- **WhatsApp:** Monitoramento visual de status com indicador e verificação no painel.

---

## 5. Documentação do Projeto

- [Melhorias de Layout UX Sidebar e Rodapé](docs/layout-ux-sidebar-footer.md)
- [Status Atual da Operação](docs/status-atual.md)
- [Vincular grupos às obras](docs/whatsapp-groups-by-project.md)
- [Conferência, aprovação e pagamento](docs/expense-review-flow.md)
- [Webhook da Evolution Go](docs/evolution-webhook.md)
- [Demonstração na Vercel](docs/vercel-demo.md)
