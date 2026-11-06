# SENDOBRA — roteiro do ciclo 1: consolidação operacional

Versão 1.0 — 05/11/2026, America/Sao_Paulo. Status: planejamento pronto para revisão; execução não iniciada.

Este roteiro consolida as especificações abaixo. Não autoriza implementação, contratação, cópia de dados de produção ou publicação. A orientação vigente do usuário é analisar e documentar.

## 1. Resultado do ciclo

Preparar uma versão candidata em que pendências permaneçam acessíveis, decisões financeiras sejam consistentes, dados possam ser recuperados e mídia tenha homologação rastreável. Separar conclusão documental, implementação, validação isolada e liberação operacional: uma não comprova as demais.

O ciclo preserva uso supervisionado. Recuperação garantida de mensagens depende de B04/B08, ainda fora das quatro especificações detalhadas. Não declarar operação autônoma/contínua pronta ao terminar somente os itens deste roteiro.

## 2. Referências e estado de partida

| Documento | Escopo | Estado comprovado nesta conversa |
| --- | --- | --- |
| [Plano geral](plano-evolucao-2026-11-05.md) | Diagnóstico e backlog de 30 melhorias | Documentado |
| [B01 — Pendências](especificacao-pendencias-b01.md) | Paginação, detalhe, arquivos e fila completa | Especificação escrita; 22 cenários planejados |
| [B02/B03 — Aprovação e pagamento](especificacao-aprovacao-pagamento-b02-b03.md) | Concorrência, idempotência e auditoria | Especificação escrita; 26 cenários planejados |
| [B05 — Backup e restauração](especificacao-backup-restauracao-b05.md) | Consistência, cópia independente e ensaio | Especificação escrita; 24 cenários planejados |
| [B18 — Áudio e imagem](especificacao-homologacao-midia-b18.md) | Ponta a ponta, falhas e duplicidade | Especificação escrita; 36 cenários planejados |

Há 108 cenários identificados nas quatro especificações. Alguns se sobrepõem e podem compartilhar evidência, mas cada ID deve ter resultado próprio e referência à versão testada. Esses 108 cenários não foram executados. Os 40 testes selecionados aprovados anteriormente na conversa são linha de base parcial, não aprovação dessas especificações.

Conexão e texto de 05/11 foram confirmados pelo usuário. Não repetir como requisito de planejamento. Vínculo exato da obra e demais mídias devem ser registrados na homologação futura.

O conjunto documental detalhado está salvo localmente. Não presumir que foi commitado, enviado ao GitHub ou sincronizado ao Obsidian só porque o relatório inicial foi salvo nesses destinos.

## 3. Ordem recomendada

| Etapa | Trabalho futuro | Entrega verificável | Condição para avançar |
| --- | --- | --- | --- |
| E0 | Fechar decisões mínimas e inventariar a versão | Registro de decisões, responsáveis, serviços e ambiente de teste | Contratos e alvos conhecidos, escopo mantido |
| E1 | Demonstrar recuperação inicial em isolamento | Ensaio B05 com dados sintéticos e mecanismo suportado | Banco e arquivo recuperados com integridade; sem efeito em produção |
| E2 | Resolver pendências antigas — B01 | Candidata com fila completa e revisão por ID | T01–T22 classificados e falhas críticas corrigidas |
| E3 | Resolver aprovação/pagamento — B02/B03 | Candidata com transição atômica e operação idempotente | A01–A26 classificados e falhas críticas corrigidas |
| E4 | Revalidar recuperação do schema candidato | B05 completo, incluindo estruturas novas e destino independente | R01–R24 classificados; RPO/RTO medidos e limitações resolvidas/documentadas |
| E5 | Homologar mídia na candidata — B18 | Relatório ponta a ponta e falhas isoladas | M01–M36 classificados; nenhum defeito crítico aberto |
| E6 | Decidir liberação e preparar mudança | Pacote de release, cópia válida anterior e retorno compatível | Critérios da seção 8 atendidos; execução de produção separadamente autorizada |
| E7 | Observar o piloto após eventual liberação | Registro de indicadores e incidentes | Estabilidade e uso supervisionado avaliados, sem inventar resultado |

E1 evita desenvolver mudanças sem sequer demonstrar um mecanismo de recuperação. Não precisa copiar produção nem concluir toda a política B05 para permitir desenvolvimento isolado de E2/E3. E4 exige revalidar o backup após eventual nova tabela de operações/coluna de versão de E3; um ensaio do schema antigo não basta.

E2 vem antes de E3 para garantir que dados pendentes não fiquem ocultos durante homologação financeira. E5 avalia a versão integrada; testes técnicos isolados de mídia podem ser preparados antes, mas não substituem a homologação final.

## 4. Dependências e pontos de bloqueio

| Dependência | Onde afeta | Tratamento |
| --- | --- | --- |
| Exportação/importação D1/R2 suportada e acesso autorizado | E1/E4 | Verificar capacidade real; não inventar comando/recurso |
| Destino independente e custódia de chave | E4/E6 | Escolher com orçamento aprovado, se necessário; não contratar automaticamente |
| Preservação de entrada durante janela de cópia | E4/E6 | Demonstrar reentrega/buffering ou reconciliar lacuna; não presumir garantia por HTTP 503 |
| Atomicidade no runtime D1 | E3 | Provar mecanismo com concorrência/rollback antes de consolidar solução |
| Consumidores administrativo/principal/demonstração | E2/E3/E6 | Atualização coordenada; manter isolamento e não deixar endpoint antigo contornar controle |
| B04 — entrada durável/cache | Recuperação e custo de mídia | Dependência externa ao escopo detalhado; sem ela, registrar limite de continuidade |
| B08 — recuperação além de 24 horas | E4/E5 | Não alterar timestamps originais para contornar janela |
| B12 — correção/cancelamento | Limpeza de homologação e operação | Não apagar lançamentos reais para simular correção; manter testes identificados/isolados |
| B15 — CI/documentação | E2–E6 | Executar verificações relevantes a todos os serviços afetados |

Se a preservação da entrada e o objetivo de recuperação não forem demonstrados, não declarar continuidade ou B05 completo. A equipe pode continuar desenvolvimento e testes isolados; liberação operacional permanece condicionada à avaliação explícita do risco, sem rotular item incompleto como aprovado.

## 5. Decisões mínimas antes de implementar

Estas decisões ficam registradas, sem exigir resposta para a entrega deste documento:

| Decisão | Proposta de partida | Status |
| --- | --- | --- |
| Acesso à conferência | Proprietário ativo, mantendo regra atual | Proposta, sem ampliação de cargos |
| Ordem da fila | Mais antiga primeiro; inversão disponível | Proposta B01 |
| Aprovação | Manter política atual e impedir autoaprovação | Regra existente a preservar |
| Pagamento | Estados separados, transições sem regressão e comprovante específico | Proposta B03 |
| Concorrência | Versão do registro e ID único por intenção | Proposta a provar no runtime |
| Recuperação | RPO até 24h e RTO até 4h | Metas propostas, ainda não medidas |
| Retenção | 14 pontos diários e 8 semanais | Dimensionar volume/custo antes de ativar |
| Responsáveis | Negócio PST, operador técnico, custodiante e substituto | Nomes a designar |
| Janela e destino de backup | Definir por capacidade e impacto medidos | Em aberto |
| Volume esperado | Medir mensagens/mídias/usuários para dimensionar | Em aberto |

Decisão não resolvida só bloqueia a atividade que depende dela. Não alterar política financeira ou de privacidade por conveniência de implementação. Propostas deste roteiro não são aprovação de negócio tácita.

## 6. Pacotes de trabalho revisáveis

### P0 — Preparação e baseline

Inventariar commits e versões implantadas, schema/migrations, consumidores de API e capacidades de exportação. Preparar fixtures privadas/sintéticas com duas obras, usuários por perfil e mensagens antigas. Registrar comportamento anterior dos casos críticos sem dados reais. Resultado: baseline reproduzível e alvos isolados comprovados.

### P1 — Recuperação inicial

Executar futuramente E1 com conjunto pequeno sintético contendo mensagem pendente, despesa, comprovante e auditoria. Verificar decifragem e restauração por procedimento suportado. Resultado: caminho de recuperação demonstrado, com pendências de escala/política explicitadas.

### P2 — Fila e contrato B01

Separar listagem de detalhe/mutação; desenhar cursor/filtros e consultas de duplicidade fora da página; preservar autor e arquivo; atualizar os consumidores. Testar com 600 mensagens e mais de 300 imagens, além do volume proposto de 10.000 mensagens em laboratório. Resultado: nenhuma pendência desaparece por corte fixo e indicadores representam toda a fila.

### P3 — Integridade financeira B02/B03

Provar estratégia de transição e auditoria atômica, definir migration aditiva, operação idempotente e contrato de versão. Atualizar comandos de aprovação/pagamento e tratamento de timeout/conflito. Resultado: um efeito financeiro por intenção válida e histórico fiel à alteração efetiva.

### P4 — Recuperação completa da candidata

Incluir novas estruturas de P2/P3, medir cópia/validação/restauração e independência de acesso. Conferir revogações de acesso e eventos posteriores à cópia no plano de incidente. Resultado: manifesto íntegro e ensaio com valores/hashes/vínculos conferidos, metas medidas e alertas planejados/implantados conforme escopo autorizado.

### P5 — Mídia integrada

Usar o gabarito B18, avaliar sugestão antes de correção humana e percorrer conferência/aprovação/arquivo. Simular falhas apenas em isolamento; serviços reais entram em positivos controlados com custo autorizado. Resultado: cobertura por cenário, métricas e limites conhecidos, sem confundir mídia funcional com fila durável implementada.

### P6 — Pacote de liberação

Reunir evidências, versões, migrations, compatibilidade, backups e retorno. Revisar a diferença entre estado desejado e implementado. Resultado: decisão concreta e revisável sobre publicação; este roteiro não executa essa decisão.

Os pacotes sugerem mudanças pequenas para revisão de código; não são commits já criados nem tarefas iniciadas. Nenhum prazo fechado foi estimado. Reestimar depois de comprovar exportação/restauração e atomicidade, dois pontos com incerteza técnica relevante.

## 7. Evidência e classificação de resultados

Cada cenário recebe ID original, ambiente, commit, versão de schema, fixture, resultado esperado/observado, evidência protegida, responsável e data. Classificações:

- Não executado: existe especificação, sem comprovação.
- Aprovado: comportamento demonstrado na versão identificada.
- Falhou: comportamento diverge; abrir defeito com reprodução e impacto.
- Bloqueado: falta dependência; não conta como aprovado.
- Não aplicável: exige justificativa e revisão; não usar para excluir risco conhecido.

Evidências reutilizadas entre documentos devem ter o mesmo ambiente/versão compatível. Alteração em autorização, schema ou transição financeira exige repetir cenários impactados; não repetir indiscriminadamente toda verificação sem motivo.

Defeito crítico neste ciclo: acesso indevido, perda de dado aceito sem recuperação conhecida, duplicação financeira, alteração de autor/obra indevida, transição sem auditoria ou auditoria falsa de sucesso, aprovação própria, confirmação indevida de pagamento, restauração corrompida declarada válida. Esses defeitos impedem liberação da capacidade afetada até correção e reteste.

## 8. Critérios para liberar a candidata

| Critério | Evidência exigida |
| --- | --- |
| Escopo rastreável | Requisitos → mudanças → cenários → versão candidata |
| Pendências acessíveis | T01–T22 classificados, sem falha crítica aberta |
| Financeiro consistente | A01–A26 classificados, inclusive concorrência real no runtime isolado |
| Recuperação comprovada | R01–R24 classificados; cópia e restauração coerentes; independência demonstrada |
| Mídia homologada | M01–M36 classificados; positivos reais controlados e falhas isoladas |
| Contratos compatíveis | Todos os consumidores atualizados ou legados recusados com proteção equivalente |
| Segurança e acesso | Perfis e arquivos testados com acesso permitido e negado |
| Operação preparada | Responsáveis, alertas, limites e procedimento de incidente definidos |
| Retorno revisável | Código/schema compatíveis, dados novos preservados e único destino de gravação |
| Estado comunicado | Limitações B04/B08 e demais lacunas não ocultadas |

A classificação de todos os cenários não significa aprovação automática: falhas, bloqueios e não aplicáveis precisam de decisão explícita. Não aceitar exceção que transforme defeito crítico em comportamento aprovado. Mudanças de metas operacionais devem ser registradas pelo responsável, com a limitação visível.

## 9. Publicação e observação futuras

Antes da produção: confirmar autorização para a mudança concreta, alvo, audiência, cópia íntegra anterior, janela de impacto e sequência de migrations/servidor/clientes. Não usar restauração de dados como solução automática para erro visual.

Após eventual publicação, acompanhar idade da pendência mais antiga, volume de conferência, conflitos financeiros, falhas de mídia, duplicatas, último ponto recuperável e disponibilidade de arquivos. Comparar com baseline. Janela inicial proposta: cinco dias úteis de uso supervisionado, ajustada ao volume real; duração sozinha não prova estabilidade.

Se não houver uso suficiente, manter conclusão como evidência limitada, sem alegar escala comprovada. Registrar incidentes, correções e revalidações. Ampliação de usuários/obras exige decisão posterior, não decorre automaticamente de um deploy.

## 10. Situação ao encerrar o planejamento

- Diagnóstico, quatro especificações e este roteiro estão documentados.
- As funcionalidades propostas não foram implementadas neste trabalho.
- Os 108 cenários estão planejados, sem execução nova destas matrizes.
- Não foram feitos backup de produção, restauração, contratação ou publicação.
- Primeiro passo de execução, quando autorizado: **E0/P0 — inventário e baseline em ambiente isolado**, seguido do ensaio inicial de recuperação E1/P1.

O planejamento do primeiro ciclo está consolidado. Não é necessário produzir outra especificação para adiar o início: a próxima mudança de fase é autorizar execução do recorte concreto, mantendo as decisões e limitações acima explícitas.
