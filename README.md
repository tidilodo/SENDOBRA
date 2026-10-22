# SENDOBRA — PST Construtora
Aplicação operacional com backend Cloudflare Workers, D1 e R2. Fonte da especificação no diretório pai. Sem dados fictícios de produção.

## Implementado
Cadastro de obras, fornecedores, categorias, equipe com vínculos, lançamentos financeiros e operacionais, aprovar/rejeitar com motivo, pagamento informado separado de evidência revisada, upload privado autenticado, auditoria e CSV filtrado. Interface pt-BR responsiva.

## Uso
Entre com ChatGPT na URL privada. A primeira identidade autenticada pelo acesso privado do Sites é o proprietário inicial. Cadastre uma obra antes do lançamento. Configure categorias e fornecedores conforme os dados reais. Cadastro de equipe não altera a audiência privada do Site.

## Verificação
`node --test tests/domain.test.mjs`; `node node_modules/typescript/bin/tsc --noEmit`. Build pelo helper Sites. Migrations em drizzle/.

## Estado e limites
Esta entrega é uma fundação funcional do painel; NÃO atende ainda todos os critérios do MVP WhatsApp. WhatsApp, IA, transcrição e n8n não conectados. A API de ingestão assinada e o adaptador piloto foram preparados; a API fica desativada sem segredo de servidor. Não há autenticação de comandos WhatsApp. Sem edição de lançamentos, cancelamento ou reprocessamento de mensagens nesta versão. Relatórios por categoria/fornecedor, edição de cargos/vínculos, retenção automatizada, backup externo e restauração de produção permanecem pendentes. Não contratar serviços sem orçamento aprovado.
`n## Etapa WhatsApp`nImplementada API assinada HMAC (desativada sem segredo), configuração por proprietário, vínculo grupo/obra/remetente, deduplicação atômica, comandos de texto explícitos e pedido de esclarecimento. Conector piloto em adapter/ com sessão e fila locais, reconexão limitada e QR somente loopback. Ainda NÃO pareado nem testado contra WhatsApp real. IA, transcrição e ingestão de anexos WhatsApp permanecem indisponíveis. Consulte adapter/README.md.

