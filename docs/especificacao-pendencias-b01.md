# B01 — Pendências sempre acessíveis

Especificação funcional e técnica proposta, versão 1.0, 05/11/2026 (America/Sao_Paulo).

Status: pronta para revisão documental. Implementação, testes novos e publicação não executados. Relacionada a F01/B01 do [plano de evolução](plano-evolucao-2026-11-05.md).

## 1. Resultado esperado

Toda mensagem persistida que ainda exige conferência deve continuar localizável e revisável, independentemente da idade e da quantidade de mensagens posteriores. A tela deve mostrar a fila real, com navegação completa, sem confundir a página atual com o total de pendências.

Exemplo: uma despesa enviada na segunda-feira permanece pendente. Mesmo que outras 600 mensagens sejam recebidas e revisadas durante a semana, essa despesa aparece na fila e pode ser concluída com seu comprovante original.

## 2. Problema observado e limites da análise

Em `app/api/expense-inbox/route.ts`, `context()` consulta as 200 mensagens mais recentes, incluindo revisadas, e os 300 comprovantes mais recentes. O GET monta fichas desse recorte. O POST também procura a mensagem nesse conjunto. Em `app/ExpenseInbox.tsx`, a seleção de pendentes acontece no navegador por ausência de lançamento vinculado.

Consequências inferidas: mensagens antigas podem desaparecer da fila; uma revisão pelo ID pode retornar 404 mesmo com a mensagem no banco; uma imagem antiga pode perder sua associação visual na ficha; contagens e candidatos a duplicidade podem refletir apenas parte do histórico.

Essas consequências derivam da leitura de código. Ainda não foi executada reprodução com volume acima dos limites. O teste de texto confirmado pelo usuário continua válido e não precisa ser repetido para documentar B01.

## 3. Escopo desta entrega futura

Incluído:

- Filtrar pendências no servidor antes de paginar.
- Navegar pela fila completa, com ordenação determinística.
- Consultar uma ficha pelo ID, sem depender da página carregada.
- Revisar por ID com validação e controle concorrente preservados.
- Carregar comprovantes associados às mensagens consultadas.
- Calcular contagem e idade da pendência mais antiga sobre toda a fila autorizada.
- Preservar verificação de duplicidade além da página atual.
- Tratar inconsistências de dados sem esconder a mensagem.
- Atualizar a interface administrativa efetivamente publicada e a origem compartilhada pertinente.

Fora deste recorte: delegar revisão ao gerente; descarte de mensagens; respostas automáticas; classificador operacional; alteração das regras de aprovação/pagamento; fila durável de entrada; reprocessar eventos que nunca foram persistidos; reformular todo o painel ou migrar banco. Esses pontos permanecem no backlog geral.

## 4. Regras de negócio

### RB01 — Definição de pendência

Para o modelo atual, a fila de conferência contém mensagem persistida sem `record_id`. Os estados de processamento servem como rótulo e filtro complementar; não devem remover silenciosamente uma mensagem sem desfecho. A futura introdução de descarte/cancelamento precisará redefinir explicitamente o conjunto de estados terminais.

Mensagem com `record_id` pertence ao histórico de conferência. Se o lançamento vinculado foi rejeitado na aprovação, isso não reabre automaticamente a mensagem de origem. Um vínculo apontando para registro inexistente é inconsistência a sinalizar, sem apagar ou recriar automaticamente registros.

### RB02 — Origem e autoria

Preservar a origem histórica gravada no documento da mensagem; usar autoria do comprovante e mapeamento de remetente apenas como alternativas controladas para dados legados, como no fluxo existente. Um mapeamento de WhatsApp alterado depois do envio não pode reatribuir o autor original.

Se o autor não puder ser resolvido, a mensagem continua visível ao proprietário, marcada como bloqueada por inconsistência. A consulta não pode depender de INNER JOIN que elimine esse item. O bloqueio impede criar ou vincular despesa até haver correção autorizada em entrega própria.

### RB03 — Acesso

Manter a conferência exclusiva de proprietário ativo autenticado. Conferir autorização em listagem, detalhe, contagem, revisão e acesso a arquivo. Cursor ou conhecimento do ID não concedem acesso. O usuário comum continua com o comportamento atual de acompanhamento permitido em outras rotas; B01 não amplia esse acesso.

### RB04 — Obra e grupo

Obra inativa, autor desativado, permissão removida, grupo pausado ou obra não resolvida não devem ocultar a pendência histórica. Mostrar o impedimento e revalidar as permissões no envio da revisão. Pausar o grupo bloqueia novas entradas, preservando o histórico conforme regra existente.

Criar despesa continua exigindo obra ativa autorizada ao autor e respeito ao vínculo do grupo. B01 não permite contornar um bloqueio escolhendo arbitrariamente outra obra.

### RB05 — Independência da paginação

Uma revisão válida não depende da posição da mensagem na lista, da página visitada, do filtro ativo ou de ela estar entre as mais recentes. A mensagem é buscada diretamente por ID; lançamento de destino de um vínculo também é validado diretamente por ID.

### RB06 — Comprovante e duplicidade

O comprovante é localizado pela relação com a mensagem; nenhum corte global de 300 imagens participa dessa associação. Arquivo ausente gera aviso específico e impede ações que exijam material não disponível; não deve parecer ausência de pendência.

Alertas de duplicidade consideram os candidatos relevantes no histórico autorizado completo: mesmo hash e combinações de obra/valor/data, mantendo as regras atuais. A página do navegador não pode delimitar os candidatos. A confirmação de despesa distinta continua explícita; nunca mesclar automaticamente.

## 5. Experiência proposta

Ao abrir Conferência, mostrar pendências da mais antiga para a mais recente. É uma decisão proposta para reduzir esquecimento; o usuário pode escolher a ordem inversa. Desempatar por ID para garantir ordem estável.

Cabeçalho: total de pendências, total de itens exibidos, idade da mais antiga e botão Atualizar. Filtros mínimos: obra (incluindo obra não resolvida), tipo de mensagem e período de recebimento. Usar America/Sao_Paulo nas datas visíveis. O filtro de obra deve considerar o contexto/proposta persistido e mostrar divergências explicitamente; não extrair uma nova obra por aproximação só para filtrar.

Cada ficha mostra autor, obra/contexto, recebido em, tipo, mensagem original, imagem privada quando houver, dados sugeridos, campos faltantes, duplicidades e bloqueios. Mostrar a origem da obra quando houver diferença entre grupo e mensagem.

Estados obrigatórios:

| Estado | Comportamento |
| --- | --- |
| Carregando | Indicar consulta em andamento; não anunciar fila vazia |
| Vazio real | “Nenhuma mensagem aguardando conferência.” somente após consulta válida |
| Filtro sem resultado | “Nenhuma pendência corresponde aos filtros.” com ação de limpar |
| Erro inicial | Mensagem de falha e nova tentativa, sem afirmar inexistência de pendências |
| Erro ao carregar mais | Preservar fichas carregadas e permitir tentar novamente |
| Mais páginas | Botão Carregar mais; navegação completa sem truncamento silencioso |
| Revisão concluída | Retirar da fila após confirmação persistida e atualizar indicadores |
| Revisada em outra sessão | Avisar conflito e oferecer atualizar/consultar o lançamento existente |
| Sessão expirada | Solicitar novo acesso sem anunciar sucesso; preservar dados editados em memória enquanto a tela existir |
| Autor/arquivo inconsistente | Manter ficha visível, com bloqueio e motivo legível |

Trocar filtro ou ordem inicia nova navegação. Não limpar silenciosamente edição em andamento: pedir confirmação contextual ou preservar a edição. Requisições antigas não podem sobrescrever o resultado do filtro mais recente. Não persistir conteúdo financeiro em localStorage como parte de B01.

## 6. Contrato de API proposto

Preservar o caminho `/api/expense-inbox` e as ações POST existentes. Introduzir paginação explicitamente versionada para coordenar atualização dos consumidores atuais; um cliente antigo não pode receber só a primeira página e interpretar como fila completa.

### GET de listagem, versão 2

Parâmetros propostos: `version=2`, `view=pending|history`, `limit` (padrão 50, máximo 100), `cursor`, `order=oldest|newest`, `project`, `kind`, `received_from`, `received_to`. Datas de filtro são datas locais inclusivas, convertidas no servidor para intervalo UTC com fim exclusivo. Parâmetro inválido retorna 400; não é ignorado silenciosamente.

Resposta conceitual:

```json
{
  "items": [],
  "page": {
    "limit": 50,
    "has_more": false,
    "next_cursor": null,
    "snapshot_at": "2026-11-05T20:00:00.000Z"
  },
  "summary": {
    "pending_total": 0,
    "matching_total": 0,
    "oldest_pending_at": null,
    "calculated_at": "2026-11-05T20:00:00.000Z"
  }
}
```

`pending_total` representa toda a fila autorizada, sem os filtros opcionais; `matching_total` representa a visão e os filtros selecionados. `oldest_pending_at` refere-se à fila pendente completa autorizada. Contagens refletem o instante da consulta e podem mudar por ação de outra sessão; não são promessa de snapshot transacional de toda a navegação.

Cursor opaco, validado, vinculado à versão, visão, filtros e ordem. Conter referência de posição (`received`, `id`) e limite superior temporal da navegação; limitar tamanho e rejeitar alteração/incompatibilidade. Toda consulta continua revalidando o ator; não usar cursor como autorização. Recebimento usa horário atribuído pelo servidor, não timestamp alegado pelo remetente.

Paginação por chave, sem OFFSET crescente. Ordenar pelo par `(received,id)` e consultar `limit + 1` para descobrir próxima página. Novas mensagens posteriores ao início da navegação aparecem após Atualizar. Definir e testar o empate no limite temporal; IDs novos com mesmo timestamp não podem ser apresentados como snapshot rigoroso. Para registros que não mudem durante a navegação, garantir ausência de repetição/omissão. Não prometer snapshot de banco que a implementação não oferece.

Se outra sessão revisar um item durante a navegação, ele pode deixar a fila. A interface deduplica por ID e aceita redução do total; uma página vazia com cursor válido deve continuar até o fim ou fornecer um próximo cursor correto, sem fingir fim prematuro. Preferir que o servidor já filtre os itens atuais antes de montar a página.

### GET de detalhe

Propor `version=2&id=<id>` sem parâmetros de listagem. Consulta direta por ID, com conteúdo, anexo associado, bloqueios e resultado de revisão se já concluída. 404 significa ausência efetiva do recurso após autorização. Usuário não autorizado é recusado antes de revelar existência ou conteúdo.

### POST de revisão

Manter `submit` e `link` e as confirmações atuais. O POST consulta mensagem, autor e comprovante por vínculo exato; destino do link por ID. Preservar autor original, valor em centavos, validação de calendário, obra permitida, aprovação pendente e pagamento não informado.

Continuar com transição condicionada e atomicidade entre criação/vínculo, atualização da mensagem, associação de anexo e auditoria. Duas revisões do mesmo item geram um sucesso e um conflito, sem lançamento órfão ou auditoria falsa. Manter proteção entre esse endpoint e `/api/whatsapp-receipts`.

| Código | Uso proposto |
| --- | --- |
| 200 | Consulta ou revisão concluída |
| 400 | Filtros, cursor ou campos inválidos |
| 401 | Sessão ausente/expirada no contrato novo, se uniformizado nos consumidores |
| 403 | Ator ou ação não autorizados; regras atuais não podem ser relaxadas |
| 404 | Mensagem realmente inexistente |
| 409 | Revisão concorrente, ficha já concluída ou conflito de negócio |
| 413 | Corpo acima do limite |
| 500/503 | Falha interna/transitória sanitizada, sem declarar sucesso |

O contrato atual retorna 403 para ausência de proprietário; eventual distinção 401/403 exige atualização coordenada e testes. Não alterar essa semântica incidentalmente.

## 7. Consultas, dados e compatibilidade

Separar três responsabilidades: consulta da fila; consulta de detalhe; validação/mutação da revisão. A página carregada não é contexto de autorização nem de gravação.

Carregar somente mensagens da página e comprovantes relacionados. Resolver candidatos de duplicidade por critérios no servidor sem `SELECT *` de todo o histórico em cada ficha. A precisão da duplicidade não pode depender do corte de páginas; a estratégia poderá usar projeção/indexação dos campos já persistidos. Definir isso na implementação antes de aceitar a entrega.

Revisar índices para pendência/ordenação e relações de comprovante. Existe índice por grupo/recebimento; não presumir que resolve fila global. Justificar novo índice com plano de consulta e volume representativo. Não incluir migração de banco apenas por preferência tecnológica.

Se filtros exigirem campos projetados a partir de JSON, documentar extração e preenchimento de dados legados. Não reinterpretar textos históricos e alterar obras/valores automaticamente durante uma migração. Campo desconhecido permanece desconhecido.

Não excluir, recadastrar ou alterar ID/autor/obra das mensagens existentes para corrigir paginação. Não modificar arquivos R2. Novas colunas/índices, se necessários, devem ter migration versionada, ensaio e compatibilidade com a versão anterior.

Verificar os consumidores: `app/ExpenseInbox.tsx`, cópia administrativa em `deployment/admin-app/app/ExpenseInbox.tsx`, proxy administrativo e testes de integração. O pacote demonstrativo deve ser inspecionado para garantir que nenhum contrato novo amplie seus dados autorizados. Deprecar versão antiga somente após confirmar todos os consumidores atualizados. Nenhum endpoint de demonstração deve herdar acesso de proprietário.

## 8. Cenários de teste e aceite

Todos os cenários abaixo são planejados; não foram executados nesta etapa documental.

| ID | Preparação / ação | Resultado obrigatório |
| --- | --- | --- |
| T01 | 600 mensagens; a mais antiga pendente, 599 posteriores revisadas | Antiga aparece e revisão conclui sem 404 falso |
| T02 | 600 pendentes; percorrer páginas de 50 sem alterações concorrentes | Conjunto de IDs completo, sem duplicação |
| T03 | Pelo menos 100 mensagens com mesmo `received` | Ordem estável pelo ID e cobertura integral |
| T04 | Comprovante antigo seguido de mais de 300 imagens | Ficha antiga abre e vincula o arquivo correto |
| T05 | Revisar por ID item ausente de qualquer página carregada | Revisão válida independe da listagem |
| T06 | Duas sessões fazem submit no mesmo item | Um 200, um 409; um lançamento e um evento efetivo |
| T07 | Link e submit concorrentes, incluindo rota antiga de comprovantes | Uma revisão efetiva; anexos íntegros; sem registro órfão |
| T08 | Revisão em outra sessão durante paginação | Lista pode diminuir; não há erro de cursor nem fim falso |
| T09 | Novas mensagens durante navegação | Itens novos entram em Atualizar; comportamento de empate documentado |
| T10 | Cursor inválido, adulterado, demasiado grande ou com filtros diferentes | 400 sanitizado; sem consulta irrestrita |
| T11 | Sem sessão, funcionário e gerente consultam/revisam/abrem arquivo | Acesso recusado conforme contrato; sem conteúdo ou contagem indevidos |
| T12 | Autor desativado ou remetente sem mapeamento atual | Pendência não some; autoria preservada ou bloqueio explícito |
| T13 | Obra inativa, permissão removida ou grupo pausado | Histórico visível ao proprietário; mutação respeita a regra aplicável |
| T14 | Anexo sem objeto no armazenamento | Ficha não some; aviso legível; sem vincular evidência inexistente |
| T15 | Duplicata de hash/obra/valor/data fora da página atual | Alerta persiste; confirmação necessária antes de despesa distinta |
| T16 | Filtros por obra, tipo e datas nos limites do dia brasileiro | Lista, total filtrado e exportações afetadas permanecem coerentes |
| T17 | Falha da API na primeira página e em Carregar mais | Nunca aparece falso “nenhuma pendência”; edição e itens preservados |
| T18 | Sessão expira durante edição; usuário reenvia depois de entrar | Sem sucesso falso, perda silenciosa ou duplicação |
| T19 | História com item rejeitado e item vinculado | Não reabre mensagem automaticamente; detalhe informa resultado |
| T20 | JSON legado malformado ou vínculo inconsistente | Item sinalizado; não derruba toda a fila nem inventa autor/obra |
| T21 | Cliente publicado, origem principal e contratos anteriores | Compatibilidade verificada; demonstração mantém isolamento |
| T22 | Conferir indicadores com mais de 600 mensagens e filtros | Totais não são tamanho da página; idade considera fila completa |

Teste de desempenho proposto: base isolada com 10.000 mensagens, estados mistos e comprovantes associados. Registrar latência p50/p95, consultas, bytes retornados e tempo de geração das fichas em ambiente descrito. Meta inicial de laboratório: p95 até 2 segundos para página de 50 com cache frio definido e carga acordada; meta é proposta, não garantia atual. Nenhuma consulta pode precisar carregar todas as mensagens/arquivos para construir uma página. Ajustar meta com evidência antes de homologar, registrando a decisão.

## 9. Ordem de execução futura

1. Fixar contrato v2, fixtures e semântica dos filtros, incluindo dados legados.
2. Reproduzir T01/T04/T05 em ambiente isolado e registrar falha atual.
3. Separar consulta direta e listagem; desenhar consultas de duplicidade e índices.
4. Implementar servidor e compatibilidade, preservando revisão concorrente.
5. Atualizar consumidores e estados de interface de forma coordenada.
6. Executar matriz de integração, regressão dos fluxos financeiros e teste de volume.
7. Homologar com conta proprietária e dados fictícios, incluindo arquivo antigo.
8. Registrar versões, plano de retorno e evidências antes de publicar qualquer mudança.

Não há estimativa fechada de prazo. Esforço relativo M no plano geral; poderá crescer se a projeção de dados legados exigir migration. Primeiro recorte deve resolver acessibilidade da fila sem agregar módulos novos.

## 10. Definição de conclusão

B01 somente estará concluído quando T01–T22 tiverem evidência de resultado, os critérios de desempenho forem acordados e medidos, todos os consumidores pertinentes forem homologados e nenhuma mensagem/arquivo histórico tiver sido perdido ou reatribuído. Revisão preserva autoria, impede duplicação e continua separada de aprovação e pagamento.

Entregáveis futuros: alteração de código e eventual migration; testes significativos de volume/concorrência; documentação do contrato; evidências de homologação; inventário de versões implantadas e procedimento de retorno. Este arquivo entrega a especificação, não esses resultados.
