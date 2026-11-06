# B02/B03 — Aprovação e pagamento consistentes

Especificação proposta v1.0 — 05/11/2026, America/Sao_Paulo.

Status: planejamento documental. Nenhuma regra, migration, teste ou publicação foi implementada nesta etapa. Relacionada a F02/F03 e B02/B03 do [plano geral](plano-evolucao-2026-11-05.md). Complementa [B01 — Pendências](especificacao-pendencias-b01.md).

## 1. Objetivo e exemplo

Cada ação financeira deve produzir um único resultado válido, auditável e compreensível, mesmo com duas pessoas operando simultaneamente ou uma resposta de rede perdida. Aprovação, informação de pagamento e revisão de comprovante são dimensões distintas.

Exemplo: dois proprietários abrem a mesma despesa pendente. Um aprova, o outro rejeita. Apenas uma decisão é aplicada; o segundo recebe conflito e consulta o resultado efetivo. A auditoria não apresenta duas decisões como executadas.

Outro exemplo: uma despesa tem comprovante revisado. Clicar posteriormente em “Informar pagamento” não pode reduzir esse estado nem apagar a revisão documental.

## 2. Evidência atual e riscos inferidos

Fontes: `app/api/data/route.ts`, `app/domain.mjs`, `db/schema.ts`, componentes do painel principal e administrativo, `docs/expense-review-flow.md`.

- A decisão lê o registro, valida cargo/obra/autor e executa UPDATE condicionado a `pending_approval` junto com INSERT incondicional de auditoria. Não verifica a quantidade de linhas alteradas. Risco inferido: em concorrência, um pedido sem transição efetiva pode anunciar sucesso e gravar auditoria de decisão não executada.
- Pagamento permite escrever `payment_reported` ou `payment_evidenced` no campo `payment`; não condiciona versão/estado anterior. Risco inferido: regressão e sobrescrita concorrente.
- Marcar evidência exige algum anexo associado, mas a ação não identifica qual arquivo foi revisado.
- Criação manual por proprietário/gerente já nasce aprovada, enquanto despesa conferida do WhatsApp nasce pendente. Essa diferença existe e precisa continuar explícita.
- A função `canReview` impede autoaprovação, permite proprietário em despesa alheia e gerente somente para funcionário/encarregado de obra permitida.

Os riscos concorrentes não foram reproduzidos nesta etapa. Não confundir com falha já observada em produção.

## 3. Escopo e decisões propostas

Incluído: transições condicionadas; identificação da operação; resposta idempotente; conflito explícito; vínculo de comprovante específico; auditoria atômica; interface coerente; migração compatível de estados legados.

Fora: integração bancária, execução de transferência, pagamentos parciais, parcelamento, vencimentos, correção de valor, cancelamento/reabertura, estorno, folha, fechamento contábil e novas permissões. Correções/reversões pertencem ao backlog B12/B23 e não devem ser simuladas por sobrescrita deste campo.

Decisão de planejamento: manter permissões atuais, sem criar dupla aprovação obrigatória de pagamentos neste recorte. Se a PST desejar separação adicional entre quem informa e quem revisa pagamento, isso exige política e especificação próprias antes de implementar.

## 4. Aprovação: regras e estados

| Estado atual | Comando | Próximo estado | Condição |
| --- | --- | --- | --- |
| `pending_approval` | Aprovar | `approved` | Ator autorizado, diferente do autor, versão atual |
| `pending_approval` | Rejeitar | `rejected` | Mesmas condições e motivo obrigatório |
| `approved` | Aprovar/rejeitar com nova operação | Sem alteração | Conflito; decisão já encerrada |
| `rejected` | Aprovar/rejeitar com nova operação | Sem alteração | Conflito; reabertura fora do escopo |
| Qualquer | Repetir a mesma operação concluída | Resultado original | Idempotência validada e acesso atual permitido |

Motivo de rejeição: texto não vazio após trim, até 1.000 caracteres. Preservar o texto exibível na auditoria sem permitir conteúdo executar HTML. Aprovação pode ter observação opcional com o mesmo limite. Nunca alterar autor, obra, valor, categoria ou data ao decidir.

Criação manual autoaprovada deve registrar evento de criação com política aplicada; não fabricar evento de revisão por outra pessoa. B02 não muda essa política de criação nem permite que alguém aprove a própria despesa recebida como pendente.

Quando o autor for desativado, preservar autoria e cargo histórico disponível; sua desativação não apaga nem reatribui a despesa. Proprietário pode decidir despesa alheia existente; para gerente, a regra atual por cargo do autor deve ser mantida e documentada na decisão. Autor inexistente ou dados de autorização inconsistentes bloqueiam a decisão com erro legível, sem adivinhar cargo.

Revalidar ator ativo, obra permitida e política no servidor em cada operação. Cliente não escolhe cargo nem autor. Revogação e mudança de cargo entre leitura e gravação precisam ser consideradas na estratégia de transação; a implementação deve garantir que a autorização usada na gravação continue válida, e não apenas confiar em uma tela antiga.

## 5. Pagamento: semântica e transições

| Estado | Significado exibido |
| --- | --- |
| `unreported` | Pagamento não informado |
| `payment_reported` | Pagamento informado por usuário autorizado; sem confirmação bancária |
| `payment_evidenced` | Comprovante específico revisado; sem confirmação bancária |

Nenhum estado autoriza exibir “liquidado no banco”. Aprovar despesa e anexar arquivo não mudam automaticamente o estado de pagamento.

| Estado atual | Comando | Resultado proposto |
| --- | --- | --- |
| `unreported` | Informar pagamento | `payment_reported` |
| `unreported` | Revisar comprovante | `payment_evidenced`, se arquivo válido vinculado |
| `payment_reported` | Revisar comprovante | `payment_evidenced`, se arquivo válido vinculado |
| `payment_reported` | Informar novamente com nova operação | Sem alteração; informar que já está registrado |
| `payment_evidenced` | Informar pagamento | Recusar regressão com conflito |
| `payment_evidenced` | Revisar novamente com nova operação | Sem alteração; consultar revisão existente |
| Qualquer | Repetir operação concluída idêntica | Resultado original sem novo evento |

Pagamento somente para lançamento financeiro aprovado (`expense` ou `income`), com proprietário ou gerente ativo autorizado na obra. O campo genérico de pagamento para recebimentos mantém a semântica existente e deve ser rotulado como recebimento informado/revisado quando pertinente; não somar receita como saída. Registro `operation` não aceita comando de pagamento, mesmo se estiver aprovado. Essa restrição de tipo é proposta explícita de integridade.

Na revisão, exigir `attachment_id`: arquivo pertencente ao lançamento, metadados válidos, objeto privado existente e leitura permitida ao revisor. Guardar ID/hash e revisão. Um arquivo de outra obra ou outro lançamento não pode servir de evidência. Exibir os demais anexos sem sugerir que todos foram revisados.

A revisão não afirma autenticidade bancária nem correspondência automática de valor/beneficiário. O usuário deve confirmar a conferência documental. Divergência identificada é motivo para não concluir a revisão; correção documental requer fluxo futuro próprio.

Se um arquivo antes revisado ficar indisponível, preservar evento histórico e mostrar indisponibilidade atual. Não rebaixar o estado silenciosamente nem alegar que a disponibilidade foi garantida para sempre. Nova revisão de outro comprovante sem mudança de estado é funcionalidade futura, não sobrescrita deste evento.

## 6. Concorrência e idempotência

### Versão do registro

Propor `version` inteiro para revisão otimista, com valor inicial conhecido para dados existentes. Cada transição financeira efetiva incrementa a versão uma vez. Comando inclui `expected_version`; estado e versão são condicionados no momento da gravação, não só na leitura.

Uma versão única para o registro simplifica a consistência. Ações independentes também podem produzir conflito e exigir atualização; aceitar esse comportamento neste recorte. Definir quais futuras mutações incrementam versão antes de adicioná-las. Anexar arquivo não equivale a decidir ou revisar pagamento.

### Identificador da operação

Cada intenção financeira usa `operation_id` aleatório, gerado uma vez pelo cliente e reutilizado em retentativas daquela intenção. Associar no servidor a ator, lançamento, comando e resumo canônico dos campos relevantes. IDs não são autorização e não substituem proteção de origem/sessão.

Mesma chave e mesmo conteúdo: retornar resultado persistido da operação, após validar acesso atual, sem novo UPDATE/auditoria. Mesma chave com conteúdo diferente: 409 `operation_mismatch`. Chaves diferentes disputando a mesma versão: somente uma transição vence. Uma nova chave para estado já alcançado retorna conflito ou indicação de já informado, sem fabricar sucesso de transição.

O servidor deve consultar a operação existente antes de recusar `expected_version` antigo: um reenvio legítimo após resposta perdida carrega a versão anterior. A autorização atual continua sendo exigida antes de revelar o resultado. Dados pessoais/segredos não entram no identificador da operação.

Guardar resultado de operação pelo prazo necessário para retentativas; proposta: sem expiração automática neste primeiro recorte, junto ao histórico financeiro. Se houver política futura de expiração, definir garantia de reenvio e retenção antes de excluir chaves.

### Atomicidade

Persistir como uma unidade: reserva/validação da operação, transição condicionada, incremento de versão, evento de auditoria e resultado de operação. Um UPDATE que altere zero linhas não pode produzir evento de ação efetiva.

A tecnologia concreta deve ser demonstrada em D1, incluindo comportamento de rollback. Não basta executar UPDATE e INSERT incondicional no mesmo batch. Documentar como a auditoria comprova a mesma transição vencedora, por token de transição ou mecanismo equivalente com unicidade e condições. Não assumir recursos transacionais interativos que o runtime não suporte.

Falha da gravação de auditoria/resultado deve desfazer a transição ou impedir sua confirmação segundo mecanismo comprovadamente atômico. Falha de rede após commit permite retentativa pela mesma chave. Não repetir automaticamente com chave nova.

## 7. API proposta

Manter as ações `decision` e `payment` em `/api/data`, com contrato financeiro explicitamente versionado para coordenar os consumidores. Exemplo conceitual:

```json
{
  "contract_version": 2,
  "action": "decision",
  "id": "record-id",
  "operation_id": "unique-operation-id",
  "expected_version": 3,
  "decision": "approved",
  "reason": ""
}
```

Para pagamento: `payment` indica destino; `attachment_id` e confirmação de conferência são obrigatórios quando destino é evidência revisada. O cliente não envia ator nem before/after confiáveis.

Resposta de sucesso: operação, ID do registro, versão resultante, status de aprovação, estado de pagamento e `replayed` indicando reenvio. Não incluir dados internos de outras obras.

Erro de concorrência: 409 com código estável (`version_conflict`, `decision_closed`, `payment_regression`, `already_reported`, `operation_mismatch`) e instrução de atualizar. Estado atual somente se acesso foi autorizado. 400 para campos inválidos; 401/403 conforme contrato de autenticação coordenado; 404 para recurso ausente após autorização; 500/503 para falha sanitizada. Nunca converter falha de infraestrutura em simples “dados inválidos” ou anunciar transição aplicada sem evidência.

O GET que abastece o painel precisa fornecer versão e dados de revisão autorizados. Planejar compatibilidade com clientes antigos: não deixar rota legada sem proteção concorrente e não aceitar ausência de versão como sobrescrita irrestrita. Atualizar os consumidores e, ao encerrar suporte legado, recusar contrato antigo com mensagem controlada. A estratégia de implantação deve permitir voltar interface sem remover a proteção do servidor.

## 8. Auditoria e modelo de dados

Preservar os estados atuais como resumo; propor estrutura de operação financeira com ID único, ator, registro, comando, resumo canônico, versão anterior/resultante, resultado e horário UTC de servidor. Definir unicidade no banco, não somente em memória.

Auditoria de transição efetiva deve conter: ID de operação/transição, ator, autor original, obra, regra aplicada, antes/depois, motivo, data de servidor e ID/hash de comprovante quando houver. A interface apresenta o horário em America/Sao_Paulo. Não armazenar tokens, senhas ou conteúdo binário na auditoria.

Tentativa negada ou conflito, se registrados para operação/segurança, usam classificação distinta e sanitizada. Nunca aparecem como aprovação, rejeição ou revisão efetivamente concluída.

Histórico legado: inicializar versão sem inventar revisores, motivos, datas ou comprovante escolhido. Estado `payment_evidenced` sem arquivo específico historicamente identificado deve aparecer como “revisão legada sem comprovante identificado no evento”, com informação sobre os anexos disponíveis. Não escolher o primeiro arquivo para preencher lacuna nem rebaixar todos os dados automaticamente.

Checar inconsistências antes da migração (tipo operacional com pagamento, evidência sem anexo, vínculos ausentes). Produzir relatório protegido e plano de tratamento; não apagar nem corrigir em massa silenciosamente. Nova estrutura aditiva e migrations versionadas; preservar registros e auditoria existentes.

## 9. Interface e comportamento em falhas

- Ao decidir, mostrar descrição, autor, obra, valor e estado atual; rejeição pede motivo.
- Ao informar pagamento, explicar a natureza declaratória da informação.
- Ao revisar, abrir o comprovante selecionado e pedir confirmação documental explícita.
- Desabilitar comandos incompatíveis com o estado; servidor mantém validação equivalente.
- Durante envio, bloquear duplo clique daquela intenção e conservar `operation_id`.
- Se houver timeout, mostrar “Resultado ainda não confirmado” e permitir consultar/reenviar a mesma operação. Não anunciar que falhou nem orientar nova operação sem verificar.
- Em conflito, exibir decisão/estado atual autorizado e manter motivo digitado para consulta, sem reaplicá-lo automaticamente.
- Ao atualizar, refletir estado e totais confirmados pelo servidor. Não mover valor de aprovado para pago por mera animação ou resposta otimista.
- Sessão expirada exige novo acesso; preservar a intenção em memória enquanto a tela existir e consultar resultado após autenticar. Não guardar conteúdo financeiro em localStorage neste recorte.

Auditoria deve permitir abrir a transição e ver motivo, versão, revisor e comprovante. A criação autoaprovada manual deve ser distinguível de aprovação posterior.

## 10. Matriz de validação futura

Os cenários são critérios planejados, não testes executados nesta etapa.

| ID | Cenário | Resultado exigido |
| --- | --- | --- |
| A01 | Proprietário decide despesa alheia pendente | Uma transição, versão incrementada e auditoria correspondente |
| A02 | Qualquer cargo tenta aprovar a própria despesa | Recusa; nenhum efeito financeiro |
| A03 | Gerente decide despesa de funcionário/encarregado de sua obra | Permitido conforme política atual |
| A04 | Gerente decide despesa de outro gerente/proprietário ou outra obra | Recusa, sem revelar dados indevidos |
| A05 | Rejeitar sem motivo ou acima do limite | 400, sem alteração |
| A06 | Aprovar e rejeitar simultaneamente com chaves diferentes | Um sucesso; outro conflito; um evento efetivo |
| A07 | Mesma operação aprovada reenviada após resposta perdida | Resultado original, sem novo incremento/auditoria |
| A08 | Mesma chave usada com decisão, motivo ou registro diferente | 409 por incompatibilidade |
| A09 | Nova operação tenta decidir registro já encerrado | Conflito; não reabre |
| A10 | Informar pagamento de despesa aprovada | Estado informado; aprovação e valor preservados |
| A11 | Informar pagamento em pendente/rejeitado/operacional | Recusa, sem mutação |
| A12 | Revisar com arquivo correto e disponível | Evento aponta ID/hash específico; estado evidenciado |
| A13 | Revisar com arquivo inexistente/de outro registro/obra | Recusa; sem evidência atribuída |
| A14 | Tentar voltar de evidenciado para informado | Conflito; revisão preservada |
| A15 | Duas ações de pagamento concorrentes | Uma por versão; sem sobrescrita silenciosa |
| A16 | Repetir pagamento com a mesma chave | Um evento e resultado original |
| A17 | Anexar imagem ou aprovar despesa | Pagamento não muda automaticamente |
| A18 | Falha na auditoria ou no resultado de operação | Atomicidade demonstrada; sem transição parcial |
| A19 | Ator desativado/permissão revogada entre leitura e gravação | Operação recusada conforme autorização efetiva |
| A20 | Autor desativado ou ausente | Histórico preservado; política/bloqueio explícito |
| A21 | Dados legados com evidência sem revisor/arquivo específico | Sem invenção de histórico; rótulo legado |
| A22 | Expiração, timeout e reenvio pela interface | Sem sucesso falso nem operação duplicada |
| A23 | Recebimento aprovado e registro operacional | Sem misturar receita/despesa; operacional recusa pagamento |
| A24 | Cliente antigo e retorno de versão da interface | Nenhum caminho consegue contornar proteção nova |
| A25 | Arquivo desaparece após revisão | Evento permanece; disponibilidade atual é sinalizada |
| A26 | Reenvio de operação após revogação do acesso | Resultado protegido; sem exposição por chave conhecida |

Executar testes de domínio para transições, integração no runtime real com D1 isolado para atomicidade/concorrência e ponta a ponta para confirmação/timeout. Usar dois atores reais de teste e conexões concorrentes; um teste sequencial não comprova concorrência. Não criar despesas reais para homologar.

## 11. Sequência e critério de conclusão

1. Fixar matriz de estados, contrato e política atual de cargos; registrar decisões pendentes antes de ampliar escopo.
2. Definir migration aditiva, representação de operação e prova da transação no runtime.
3. Reproduzir conflito de aprovação/pagamento em ambiente isolado e registrar comportamento anterior.
4. Implementar futuramente transições, idempotência e auditoria de forma integrada.
5. Atualizar painéis e consumidores, mantendo proteção de servidor em qualquer contrato suportado.
6. Homologar A01–A26, regressão da conferência e migração de amostra legada.
7. Documentar implantação, retorno compatível e evidências antes de publicar.

Conclusão exige: nenhuma decisão efetiva sem auditoria correspondente; nenhuma auditoria de sucesso sem transição; reenvio idêntico não duplica; estado documental não regride por comando comum; arquivo revisado é identificado; permissões e autoria são preservadas; interface não confunde aprovação com confirmação bancária. Cada critério deve ter evidência na versão candidata.

Próximo documento recomendado: B05 — backup e restauração conjunta de banco e arquivos. Esta especificação não autoriza implementação e não declara os critérios acima cumpridos.
