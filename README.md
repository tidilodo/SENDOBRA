# SENDOBRA — PST Construtora

Painel operacional com Cloudflare Workers, D1 e R2, publicado no Sites com acesso privado.

## Estado do piloto
Cadastros de obras, categorias, fornecedores e equipe; lançamentos, aprovações, anexos privados, auditoria e CSV estão implementados. O recebimento real de WhatsApp até o painel foi comprovado com uma despesa fictícia de R$ 1, sem duplicação no teste observado. Isso não comprova operação contínua nem prontidão para uso financeiro real.

O conector piloto fica em adapter/, com sessão e fila locais. A disponibilidade atual deve ser verificada antes de novos testes. Respostas automáticas permanecem desligadas; comandos estruturados autorizados podem criar lançamentos. IA, áudio e extração de documentos ainda não estão implementados.

## Regras acordadas e adaptação pendente
O grupo deve atender todas as obras. Cada mensagem precisa identificar a obra ou indicar administrativo geral explicitamente. Obra ambígua e valores não distribuídos entre obras exigem esclarecimento. Compra, aprovação e pagamento são eventos separados.

Essas regras ainda precisam de adaptação técnica: a integração atual vincula um grupo a uma obra e utiliza comandos explícitos.

## Verificação e implantação
GitHub Actions verifica padrões conhecidos de segredos, testes de domínio e WhatsApp, TypeScript e build. Essa verificação não substitui revisão de segurança. Consulte docs/online-deployment.md para o plano de hospedagem e os bloqueios de migração.

Execute os testes com `node --test tests/domain.test.mjs tests/whatsapp.test.mjs adapter/test.mjs` e TypeScript com `node node_modules/typescript/bin/tsc --noEmit`.

Não há implantação automática configurada. Backup e restauração, permissões e comprovantes precisam de validação completa antes de operação financeira real.
