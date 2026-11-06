# B01–B05 — implementação e validação

Registro de 05/11/2026. As especificações anteriores descrevem o objetivo completo; este documento registra o que o código entrega e seus limites reais.

## Código implementado

- B01: paginação por chave e cursor HMAC, ordenação/filtros no servidor, total da fila e idade da mais antiga, consulta e revisão por ID, associação de imagem sem corte de 300 arquivos, tratamento de autor legado e confirmação antes de descartar edição no painel.
- B02: transição de aprovação condicionada ao estado/versão e à autorização atual; operação persistente identifica a intenção; auditoria depende da operação vencedora. Contratos anteriores continuam sujeitos ao controle no servidor.
- B03: pagamento somente em registro financeiro aprovado, bloqueio de regressão, revisão associada a arquivo específico disponível e confirmação humana. Reenvio com a mesma operação não duplica transição.
- B04: evento autorizado é persistido em D1/R2 antes da mídia; leases impedem trabalho concorrente; cache de enriquecimento é reutilizado; retentativas têm atraso e limite de oito tentativas; falhas definitivas e autorização revogada ficam visíveis. O proprietário pode consultar e reprocessar em Configurações. Evento já aceito pode ultrapassar a janela original somente com lease persistida válida, mantendo timestamp original.
- B05: exportação autenticada em páginas, janela temporária de bloqueio de mutações com expiração, preservação de novos eventos autorizados na fila, manifesto com hashes e arquivo AES-256-GCM derivado por scrypt. Restaurador aceita somente destino local isolado e compara todas as linhas e objetos.

Migration aditiva: `0006_mixed_scrambler.sql`; novas tabelas `financial_versions`, `financial_operations`, `ingestion_jobs`, `maintenance_locks`. Nenhum registro histórico é apagado ou reatribuído.

## Validação executada

- 44 testes selecionados de domínio, transcrição/mídia, assinatura, identidade de remetente, sessão e cache/retentativa passaram.
- Integração D1/R2 em Miniflare: 650 mensagens com o mesmo timestamp foram paginadas sem omissão/repetição; mensagem antiga foi revisada; cursor adulterado foi recusado; duas decisões concorrentes produziram um sucesso e um conflito; reenvio idêntico não duplicou evento; pagamento evidenciado não regrediu.
- Fila: enqueue repetido não duplicou evento, apenas um claim venceu, cache persistiu entre tentativas e conclusão sem mensagem persistida foi recusada.
- Janela de backup: mutação financeira bloqueada, nova mensagem autorizada preservada e processamento suspenso.
- Backup sintético criptografado restaurado em runtime novo: 20 tabelas e 4 objetos conferidos integralmente. Senha errada e bytes alterados foram recusados.
- Integração existente de dois grupos por obra passou, incluindo permissões, divergência, deduplicação, arquivos privados e pausa.
- TypeScript passou. Builds do backend, receptor e painel foram executados; registrar abaixo o estado de implantação após publicação.

Isso não equivale à execução dos 108 cenários documentados nem a restauração de produção. Houve falha intermitente de inicialização do runtime Windows; a integração foi reexecutada e passou em execução isolada.

## Operação e limites

Processamento imediato ocorre após aceitação durável. A recuperação pode ser disparada pelo proprietário. O workflow horário de recuperação fica condicionado à variável `SENDOBRA_RECOVERY_ENABLED=true` e à chave dedicada nos cofres GitHub/Vercel; não deve ser ativado sem configuração verificada. O limite é de cinco jobs por chamada. A capacidade precisa ser monitorada antes de ampliar volume.

O backup completo exige janela de pelo menos três minutos para drenar operações já iniciadas. A janela bloqueia APIs de negócio, inclusive leituras que possam gravar auditoria/vínculos, mas permite enfileirar eventos novos de remetentes já autorizados. Se o processo for interrompido, a janela expira em até 15 minutos após a última renovação. Antes de escalar, medir duração e volume. O exportador tem limite de 64 MiB para o conjunto JSON; acima disso falha explicitamente e exige exportação segmentada.

Scripts: `backup-export.mjs` recebe configuração por stdin ou variáveis de ambiente; credenciais nunca entram em argumentos. `backup-restore-isolated.mjs` recebe archive/password por stdin e grava somente em `outputs/restore-<timestamp>`. Ambos exigem operação autorizada; não versionar cópias ou chaves.

O repositório principal é público. Nenhum backup de produção deve ser enviado para ele. O usuário autorizou explicitamente o destino privado tidilodo/SENDOBRA-backups, as chaves nos cofres GitHub/Vercel e a automação diária com retenção de 14/56 dias. Workflow e cofres foram configurados; o primeiro backup real e sua restauração serão verificados após publicar o endpoint. Não existe cópia de dados de produção neste repositório público.

Metas de RPO 24h/RTO 4h continuam propostas: não foram demonstradas em incidente real. Preservar responsável substituto e acesso às chaves independentemente da máquina do operador. Não apresentar a restauração sintética como garantia de continuidade de todos os provedores.

## Implantação

Estado inicial deste registro: mudanças verificadas localmente; publicação e ativação externa ainda pendentes. Atualizar com versões e resultados reais ao concluir o fluxo de publicação.
