# ZapiObra | Estado do projeto

Atualizado em 19/11/2026 (horário de Brasília).

## Produção e acesso

- [Painel administrativo](https://zapiobra-admin.vercel.app/entrar). O erro 404 foi resolvido após configurar Next.js com o diretório `deployment/admin-app` na Vercel.
- [Demonstração](https://zapiobra.vercel.app/acesso). Ambiente separado do uso da PST.
- O painel administrativo usa Vercel e Supabase Auth. As operações usam o Site privado com Cloudflare Workers, D1 e R2. Os identificadores internos legados foram preservados por compatibilidade.
- Danilo está ativo como proprietário no ZapiObra, com permissão para cadastrar obras. A senha dele, o primeiro login e o recebimento do e-mail de recuperação ainda precisam de validação com ele.

## Operação da PST

- **OBRA PST VALIDACAO REAL** é a única obra ativa confirmada no painel.
- **PILOTO · Teste WhatsApp — sem dados reais** e **DEMONSTRAÇÃO · Residência Horizonte (fictícia)** foram arquivadas. O painel mostrou **Obras arquivadas (2)**. Arquivar preserva lançamentos e arquivos, pausa grupos vinculados e permite reativação da obra.
- O painel mostra o status do WhatsApp com bolinha, ícone e botão de verificação. Ainda falta conferir grupo e remetente autorizado da obra real e observar uma mensagem chegar à conferência da obra correta.

## Entregas publicadas

- **Mobile.** Home focada em despesa, seletor compartilhado de obra, foto ou arquivo, prévia, confirmação da situação do lançamento e reenvio idempotente da despesa. Barra inferior fixa, prevenção de rolagem horizontal, campos com contraste e faixa branca do logo com botão de menu azul-marinho.
- **Desktop.** Faixa branca do logo, paleta azul-marinho e laranja, respiro no menu lateral e rodapé © ALQVIMIA.
- **Login.** Mostrar/ocultar senha e tela de recuperação por e-mail. As páginas foram verificadas em produção. A entrega do e-mail e a conclusão da troca de senha ainda precisam ser verificadas.
- Referências de código e publicação: [PRs #1 a #8](https://github.com/tidilodo/SENDOBRA/pulls?q=is%3Apr+is%3Amerged).

## Próxima validação com Danilo

1. Entrar no painel com a própria conta e cadastrar a primeira obra de trabalho.
2. Registrar uma despesa com foto no celular e conferir o lançamento e o arquivo na obra correta. Validar também uma nova tentativa após interrupção de conexão.
3. Conferir o grupo e o remetente autorizado da obra de validação. Enviar uma mensagem autorizada e verificar o recebimento em Conferência.
4. Confirmar a entrega do e-mail de recuperação no Supabase. A correção das referências visíveis restantes a SENDOBRA está preparada e segue pendente de publicação.
