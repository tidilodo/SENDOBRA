# SENDOBRA — diagnóstico e plano para o próximo nível

Roteiro consolidado: [Ciclo 1 — Consolidação operacional](roteiro-ciclo-1-consolidacao.md), com ordem de execução, dependências e critérios de liberação. Planejamento apenas.

Detalhamento disponível: [B01 — Pendências sempre acessíveis](especificacao-pendencias-b01.md), especificação documental sem implementação.

Detalhamento disponível: [B02/B03 — Aprovação e pagamento consistentes](especificacao-aprovacao-pagamento-b02-b03.md), especificação documental sem implementação.

Detalhamento disponível: [B05 — Backup e restauração conjunta](especificacao-backup-restauracao-b05.md), especificação documental sem execução de backup ou restauração.

Detalhamento disponível: [B18 — Homologação de áudio e imagem](especificacao-homologacao-midia-b18.md), plano documental sem testes novos em produção.

Data de referência: 05/11/2026, America/Sao_Paulo. Versão documental 1.0.

Mandato: analisar e documentar melhorias. Nenhuma recomendação deste documento autoriza implementação, contratação, migração ou publicação. Nesta etapa foi criado somente este relatório.

## 1. Conclusão executiva

O SENDOBRA tem uma base funcional para gestão supervisionada de obras: painel administrativo, autenticação, cadastros, recepção WhatsApp, conferência de despesas, aprovação, arquivos privados e auditoria. O próximo nível deve transformar essa base em uma operação recuperável, rastreável e utilizável por uma equipe sem dependência diária do proprietário.

A prioridade recomendada é consolidar integridade financeira e recuperação de mensagens, fechar o ciclo de conferência e desenvolver gestão operacional estruturada. Ampliar a inteligência de interpretação vem depois de definir métricas e uma base de avaliação. Migrar toda a infraestrutura ou transformar o produto em SaaS agora aumentaria o escopo antes de provar o uso operacional.

Não há base para atribuir um percentual único de conclusão: infraestrutura publicada, cobertura funcional e confiabilidade operacional são dimensões diferentes.

### Atualização fornecida pelo usuário

- Conexão WhatsApp conferida pelo usuário.
- Mensagem de texto testada com sucesso em 05/11/2026, segundo o usuário.
- Esses dois itens deixam de ser bloqueadores presumidos. Não foi exigida repetição desse teste.
- O sucesso do texto não comprova, sozinho, vínculo com a obra desejada, classificação financeira, áudio, imagem, recuperação após falha ou funcionamento de todos os perfis.
- A leitura anterior do banco mostrava vínculo com demonstração e estado de conexão gravado como desconectado. Esses dados históricos não devem prevalecer sobre a confirmação mais recente de funcionamento. A divergência revela necessidade de indicadores com horário e origem claros; o destino do teste de hoje continua sem evidência independente nesta análise.

## 2. Método, evidências e limites

Foram revisados a especificação inicial, README, documentação operacional, schema Drizzle, rotas principais, autenticação administrativa, receptor Evolution, processamento de áudio/imagem, componentes de conferência e gestão e workflow de CI. O histórico da implementação e a leitura de banco realizados no diagnóstico anterior complementam o contexto.

Legenda usada no relatório:

- **Observado:** comportamento diretamente presente no código ou documento citado.
- **Risco inferido:** consequência plausível do código, ainda sem reprodução específica.
- **Proposta:** evolução sugerida; não representa funcionalidade existente.
- **A validar:** evidência insuficiente para concluir.

Verificação automatizada: 23 testes de domínio/despesas/comprovantes/WhatsApp passaram no diagnóstico anterior desta conversa. Nesta etapa, mais 17 testes existentes de sessão administrativa, controle Evolution, mídia e recepção passaram. São 40 testes selecionados aprovados ao longo da conversa; não equivalem à suíte completa, homologação em produção, teste de carga ou auditoria de segurança. Nenhum teste novo foi criado. Não houve nova inspeção visual em navegador; itens de experiência abaixo são hipóteses derivadas do código, e não um laudo visual ou de acessibilidade.

Principais fontes locais, relativas à raiz `app-site/`:

| Fonte | O que fundamenta |
| --- | --- |
| `app/api/data/route.ts` | Cadastros, carregamento agregado, lançamentos, decisões, pagamentos e anexos |
| `app/api/expense-inbox/route.ts` | Conferência restrita ao proprietário, consultas limitadas e proteção concorrente da revisão |
| `app/api/whatsapp/route.ts` | Persistência, origem, assinatura, idempotência e arquivos privados |
| `app/group-config.ts`, `app/group-domain.mjs` | Grupos, permissões de envio e contexto por obra |
| `deployment/vercel-app/lib/evolution.mjs` | Autorização antes da mídia, processamento síncrono e encaminhamento |
| `deployment/vercel-app/lib/evolution-media.mjs` | Limites de mídia, transcrição, leitura visual e tratamento de erros |
| `deployment/admin-app/app/api/[...path]/route.ts` | Proxy autenticado e limite de corpo administrativo |
| `deployment/admin-app/lib/session.mjs`, `app/supabase-identity.mjs` | Sessão criptografada e vínculo de identidade com usuário ativo |
| `app/page.tsx`, `deployment/admin-app/app/Dashboard.tsx`, `app/ExpenseInbox.tsx` | Fluxos do painel, filtros, totais e revisão |
| `db/schema.ts`, `drizzle/` | Modelo atual e migrations |
| `.github/workflows/verify.yml` | Conjunto de verificações automatizadas configurado |
| `docs/security.md`, `docs/runbook.md`, `docs/architecture.md` | Controles documentados, pendências e divergências históricas |
| `../PST_Gestao_Inteligente_Especificacao_Vibe_Coding.md` | Escopo original e critérios de produto |

## 3. Maturidade por área

| Área | Estado sustentado pelas evidências | Próximo resultado necessário |
| --- | --- | --- |
| Acesso administrativo | Publicado; login e comprovantes verificados no histórico | Recuperação de conta, perfis reais, expiração e revogação homologadas |
| Texto pelo WhatsApp | Funcionamento de hoje confirmado pelo usuário | Rastrear a mensagem até a obra e o resultado de negócio |
| Áudio e imagem | Implementados; histórico de piloto e testes locais | Homologar no fluxo atual, inclusive erros e repetição |
| Financeiro | Conferência, aprovação e pagamento separados | Correção, cancelamento, concorrência e fechamento confiáveis |
| Gestão operacional | Registro genérico do tipo `operation` | Diário, materiais, mão de obra e ocorrências estruturados |
| Operação contínua | Receptor online; não há fila durável própria nesse caminho | Persistir antes de processar, recuperar e alertar |
| Backup | Procedimento ainda pendente na documentação | Restaurar banco e arquivos em ambiente isolado e conferir vínculos |
| Escala | Consultas agregadas e cortes fixos | Paginação, índices e filtros no servidor |
| Produto replicável | Uma organização por Site | Padronizar operação antes de desenhar isolamento entre empresas |

## 4. Achados técnicos e funcionais prioritários

### F01 — Pendências antigas podem desaparecer da conferência

**Observado:** `context()` em `app/api/expense-inbox/route.ts` busca as 200 mensagens mais recentes, inclusive revisadas, e até 300 comprovantes. O POST procura a mensagem dentro desse mesmo conjunto. A tela filtra as pendentes somente depois da consulta.

**Risco inferido:** uma pendência antiga pode sair da lista e não ser localizável por essa operação após novas mensagens, embora permaneça no banco. Comprovantes fora do corte também podem ficar ausentes da composição da ficha.

**Proposta:** consultar pendências por estado, paginar por cursor e buscar o item de uma mutação pelo ID diretamente no banco. Manter histórico separado.

**Aceite:** com mais de 500 mensagens, a pendência mais antiga continua acessível e revisável; paginação não repete nem omite itens; arquivos corretos acompanham cada ficha.

### F02 — Auditoria de aprovação pode divergir da atualização concorrente

**Observado:** a decisão em `app/api/data/route.ts` lê o registro e depois executa um UPDATE condicionado ao estado pendente junto com INSERT incondicional de auditoria. Não verifica quantas linhas o UPDATE alterou. A revisão de mensagem em `expense-inbox` já usa proteções mais fortes.

**Risco inferido:** duas decisões simultâneas podem gerar dois sucessos e dois eventos de auditoria, embora apenas uma atualização de estado ocorra. Isso não foi reproduzido nesta análise.

**Proposta:** transição condicional com versão ou revisão, auditoria vinculada à transição efetivamente executada e resposta de conflito para a solicitação perdedora.

**Aceite:** aprovar e rejeitar o mesmo lançamento simultaneamente produz uma decisão, um evento válido e conflito explícito para o segundo pedido.

### F03 — Estados de pagamento precisam de transições e histórico próprios

**Observado:** a API permite escrever `payment_reported` ou `payment_evidenced` no mesmo campo. Não há condição de versão na atualização; o botão de informar pagamento permanece disponível em registros aprovados. Existe exigência de anexo para marcar evidência revisada.

**Risco inferido:** um clique posterior pode rebaixar um estado já revisado; ações concorrentes podem sobrescrever-se. O modelo não representa pagamentos parciais, vencimento ou múltiplos pagamentos.

**Proposta:** definir transições permitidas e, quando necessário, uma entidade de eventos de pagamento. Vincular a revisão a um comprovante específico. Reversões exigem motivo e auditoria.

**Aceite:** reenvio idêntico é idempotente; não há regressão silenciosa; nenhum estado implica confirmação bancária.

### F04 — Validação diverge entre lançamento manual e conferência

**Observado:** a criação manual usa regex e `Date.parse`, enquanto a conferência usa `validDate`. A rota manual grava categoria textual e fornecedor sem as verificações de existência utilizadas na conferência. Não consulta explicitamente obra ativa nessa criação.

**Risco inferido:** datas normalizadas pelo runtime e referências inconsistentes podem produzir registros divergentes entre canais. A permissão geral do proprietário não substitui validação de existência da obra.

**Proposta:** contrato único de entrada e regras de negócio compartilhadas para todos os canais; validar data de calendário, obra ativa, categoria e fornecedor existentes.

**Aceite:** 30/02 é recusado; referências desconhecidas são recusadas; manual e WhatsApp produzem a mesma regra financeira.

### F05 — Recepção depende da conclusão do processamento de mídia

**Observado:** `receiveEvolution` autoriza, baixa mídia, chama transcrição/leitura visual e só depois persiste no backend. Há timeout de processamento e retorno 503 em falhas transitórias. A documentação reconhece ausência de fila durável própria.

**Risco inferido:** disponibilidade depende das retentativas efetivas do provedor; interrupção antes de persistir pode impedir recuperação autônoma. Duplicatas de áudio/imagem podem repetir chamadas externas antes de o backend reconhecer o evento.

**Proposta:** entrada durável com ID único, processamento assíncrono, cache por etapa, tentativas limitadas com backoff, área de falhas definitivas e reprocessamento autorizado. Persistir somente metadados necessários de eventos autorizados e proteger dados necessários à recuperação de mídia.

**Aceite:** desligar o processamento depois da aceitação não perde evento; reenviar o mesmo áudio não repete desnecessariamente a transcrição; reprocessamento preserva uma única despesa.

### F06 — Janela de 24 horas precisa de uma política de recuperação

**Observado:** o normalizador rejeita mensagens cujo horário esteja a mais de 24 horas do horário de processamento.

**Risco inferido:** uma indisponibilidade prolongada pode impedir receber mensagens legítimas atrasadas. A verificação de assinatura recente e a data original de ocorrência são conceitos distintos.

**Proposta:** manter defesa contra replay e criar recuperação controlada, com origem autenticada, ID persistente, limites de período e trilha de auditoria. Não remover a janela sem redesenhar o controle.

**Aceite:** evento antigo legítimo é recuperável pelo procedimento autorizado e não pode criar duplicatas; eventos forjados continuam recusados.

### F07 — Limites de arquivo e capacidades não são uniformes

**Observado:** o painel administrativo limita arquivo selecionado a 4.000.000 bytes; o proxy admite corpo até 4.200.000 bytes; o backend e parte das telas/documentos apresentam até 10 MB. Imagens WhatsApp têm limite de 5 MiB e áudio de 10 MiB/2 minutos no processamento. PDF pelo WhatsApp permanece sem extração automática implementada nesse caminho.

**Proposta:** matriz única por canal, com unidade explícita, margem multipart e mensagem antes do envio. Separar receber arquivo, guardar original e interpretar conteúdo. Avaliar envio direto autenticado ao armazenamento somente se houver necessidade comprovada.

**Aceite:** tela, validação e servidor concordam nos limites; arquivo imediatamente abaixo/acima do limite tem resultado previsível; PDF tem estado de suporte explícito.

### F08 — Conferência é um gargalo exclusivo do proprietário

**Observado:** GET e POST de `expense-inbox` exigem proprietário. Não há ação de descartar/arquivar uma mensagem nesse contrato; as ações são criar despesa ou vincular a uma despesa existente. A interface de conferência é centrada em despesas.

**Consequência:** mensagens de entrega, ocorrência, conversa ou conteúdo sem valor financeiro podem acumular na fila; o proprietário concentra a revisão.

**Proposta:** classificar como despesa, operacional, recebimento, documento, esclarecimento ou descarte com motivo; delegar conferência por obra sem conceder aprovação indevida. Criar atribuição de responsável e prazo.

**Aceite:** cada mensagem tem destino explícito; descarte preserva histórico; gerente vê somente suas obras; ninguém aprova a própria despesa por ter feito a conferência.

### F09 — Consultas carregam mais dados do que a tarefa exige

**Observado:** `/api/data` busca tabelas inteiras, filtra por obra no servidor em memória e entrega dados agregados. Para proprietário, inclui todo o histórico de auditoria. A conferência também busca todos os lançamentos e compara conjuntos em memória.

**Risco inferido:** custo e latência crescem com histórico, anexos e quantidade de mensagens. Isso não demonstra vazamento entre obras: o código atual aplica filtros de autorização antes da resposta.

**Proposta:** consultas com autorização no SQL, projeção dos campos necessários, paginação, busca no servidor, agregações de indicadores e índices orientados aos filtros. Medir antes de escolher banco novo.

**Aceite:** volume de resposta limitado por página; totais representam o conjunto filtrado completo; teste com volume representativo respeita orçamento de latência acordado.

### F10 — Cadastros e lançamentos têm ciclo de vida incompleto

**Observado:** a rota principal oferece criação de cadastros e ativação/desativação de usuários, mas não oferece nessa API edição de cargo/vínculos, encerramento de obra, correção ou cancelamento de lançamento. O status da obra aparece fixo como em andamento na tela revisada.

**Proposta:** edição auditada de cadastros, encerramento/reativação de obra, revisão de cargo e acesso; cancelamento com motivo e correção versionada. Definir o efeito de alterar uma obra sobre grupos e registros já existentes.

**Aceite:** erro pode ser corrigido preservando antes/depois; cancelado não entra nos totais vigentes; revogação se aplica à próxima operação autorizada; histórico permanece consultável.

### F11 — Relatórios ainda resumem lançamentos, não o caixa completo

**Observado:** a interface soma despesas e recebimentos aprovados e lista totais por obra. O estado documental de pagamento é separado. Não há no schema atual vencimentos, parcelamento, orçamento ou centro de custo estruturado.

**Proposta:** distinguir aprovado, a pagar, pagamento informado e comprovante revisado; adicionar filtros por fornecedor, categoria e responsável. Criar compromissos, adiantamentos/reembolsos e previsto versus realizado em entregas posteriores, após definir regras com a PST.

**Aceite:** total aprovado nunca é apresentado como total pago; CSV e painel usam os mesmos filtros e conceitos; exemplos de referência fecham centavo a centavo.

### F12 — Documentação e CI não acompanham igualmente todas as entregas

**Observado:** `architecture.md` ainda descreve IA sem provedor; outros documentos já descrevem Groq e Evolution. O roteiro antigo do piloto afirma ausência de testes reais, enquanto o README registra piloto posterior. O workflow revisado não lista as suítes novas de despesa, grupos, identidade Supabase, sessão administrativa e mídia/recepção Evolution; faz build da aplicação principal.

**Proposta:** consolidar arquitetura e estado atual; marcar documentos históricos; checklist por serviço publicado; incluir testes relevantes e build dos dois projetos Vercel no controle de mudanças. Registrar versão de código, migrations e deploy correspondente.

**Aceite:** uma alteração crítica de qualquer serviço executa os testes pertinentes; documentação mostra data, evidência e limitações, sem instruções históricas confundidas com estado atual.

## 5. Evolução de produto recomendada

### 5.1 Central de trabalho

Propor uma caixa única com filtros por obra, responsável, tipo, idade e estado. Cada ficha deve mostrar origem, conteúdo original, resultado interpretado, campos faltantes, possíveis duplicatas, histórico e próxima ação. Separar filas de conferência, esclarecimento, aprovação e falha técnica. Não considerar sucesso visual uma ação que ainda não foi persistida.

Notificações propostas: nova aprovação, pendência vencida, falha de entrega e grupo sem recebimentos esperados. Definir destinatário, frequência, agrupamento e silenciamento antes de habilitar mensagens. A ausência de mensagens não prova falha; requer calendário ou expectativa operacional.

### 5.2 WhatsApp com conversa rastreável

Projetar confirmação curta somente após persistência, pergunta por campo faltante e associação da resposta à mensagem original. Usar citação/identificador de conversa, expiração e regras para respostas simultâneas. Um “300” isolado não pode preencher arbitrariamente uma das várias pendências do mesmo grupo.

Criar fila de saída, idempotência de resposta, limite de frequência, prevenção de loops e configuração por grupo. Respostas ficam desligadas até homologar. O sistema não deve expor dados financeiros ou de outras obras em confirmações públicas do grupo.

### 5.3 Gestão operacional da obra

Evoluir além de `operation` genérico, nesta ordem sugerida:

1. Diário de obra: data, equipe informada, serviços executados, progresso relatado, fotos e impedimentos.
2. Materiais: item, quantidade, unidade, compra/entrega/consumo/devolução e vínculo opcional à despesa.
3. Ocorrências e logística: problema, impacto, responsável, prazo, resolução, frete e equipamento.
4. Mão de obra: presença e diárias informadas, sem inferir folha de pagamento.

Os registros devem preservar autor e fonte e permitir correção auditada. “Chegaram 20 sacos de cimento” deve poder virar entrega de material, sem exigir valor e sem criar despesa fictícia.

### 5.4 Inteligência de interpretação

Preservar a distinção atual: áudio e imagem usam serviços externos; a estruturação financeira usa regras locais. Propor extração mais ampla por contrato tipado, deixando campos desconhecidos nulos e registrando evidência por campo, versão do extrator e correção humana. O modelo nunca decide cargo, obra permitida, aprovação ou pagamento.

Montar conjunto de avaliação em português com casos autorizados e anonimizados: gírias, ruído, números falados, múltiplas obras, recibos ilegíveis, valores conflitantes, compra versus orçamento, entrega sem preço e instruções maliciosas no conteúdo. Comparar proposta com decisão humana e medir erro de valor/obra, campos corrigidos, custo e tempo economizado. Não definir confiança apenas pelo número declarado pelo modelo.

Criar interface de provedor e fallback para revisão manual. Definir teto de gasto, cache por mensagem/etapa e observação de falhas antes de ampliar chamadas. Nenhum preço ou modelo novo foi pesquisado ou contratado nesta análise.

### 5.5 Experiência, acesso e adoção

Hipóteses a validar em sessões reais: reduzir alternância entre Conferência, Aprovações e Comprovantes; manter filtros na navegação; preservar formulário se a sessão expirar; indicar carregamento antes de mostrar fila vazia; padronizar fuso America/Sao_Paulo; oferecer recuperação de senha e convite de equipe.

Planejar revisão visual em celular e desktop, teclado, foco de modal, fechamento por Escape, contraste, rótulos, mensagens de erro e leitor de tela. O código tem atributos de acessibilidade em alguns componentes, mas a conformidade não foi testada nesta etapa. Substituir confirm/prompt por fluxo contextual pode melhorar a clareza se mantiver confirmação explícita das ações financeiras.

Aceite de adoção: proprietário cadastra obra e equipe; funcionário envia ocorrência; encarregado confere; gerente aprova dentro da sua obra; cada pessoa conclui a tarefa sem orientação técnica. A divisão de responsabilidades é proposta, depende da política da PST e precisa ser implementada e homologada futuramente.

## 6. Operação, segurança e dados

### Continuidade e recuperação

- Definir responsáveis por incidentes, restauração e acesso ao provedor.
- Criar backup de banco, arquivos e configurações não secretas com retenção e verificação; proteger cópias e credenciais separadamente.
- Proposta inicial para discussão: perda máxima de dados de 24 horas (RPO) e restauração em até 4 horas (RTO). São metas sugeridas, não garantias atuais.
- Restaurar em ambiente isolado, conferir contagens, valores, autores, hashes e vínculo mensagem–lançamento–arquivo. CSV não é backup completo.
- Definir retorno de versão da aplicação compatível com migrations; não restaurar banco automaticamente para corrigir um problema de interface.

### Identidade e permissões

Já existem sessão criptografada, cookie protegido, token validado e vínculo com cadastro ativo. Próximas avaliações: recuperação de conta, MFA para proprietários, reautenticação em mudanças de alto impacto, expiração com formulário aberto, conta recriada, mudança de e-mail, desligamento de usuário e acesso de emergência documentado.

Os controles de autorização precisam de matriz de testes por rota, cargo, obra e estado, incluindo leitura de arquivo, revisão e exportação. Não presumir que todos os funcionários devem ler todas as despesas da obra: confirmar essa política de negócio. O controle atual `canProject` permite acesso por obra; detalhes por ação exigem decisão explícita.

Revisar limite de requisições por login, webhook e operação sensível; inventário e rotação de segredos; sanitização de erros; verificação de arquivos além da assinatura inicial. A chave do webhook integra o caminho da URL: revisar mascaramento em logs e processo de troca. A chave publicável Supabase encontrada no código é configuração pública, não deve ser tratada como segredo vazado.

### Privacidade e retenção

Documentar quais dados seguem para Evolution, Groq, autenticação e armazenamento; finalidade, acesso, prazo de retenção e procedimento de atendimento a solicitações. Definir retenção diferente para áudio original, transcrição, comprovante, evento técnico e auditoria. A implementação revisada retorna transcrição do áudio sem persistir o binário original nesse caminho; decidir se isso é suficiente para a operação antes de aumentar armazenamento de dados pessoais.

Esses itens são requisitos a detalhar com responsáveis; este documento não é parecer jurídico nem certificação de conformidade.

### Observabilidade

Separar indicadores: conectado no provedor, autenticado no WhatsApp, último evento recebido, último evento persistido e último registro de negócio concluído. Exibir horário e estado desconhecido/desatualizado quando necessário. Usar identificador de correlação ponta a ponta sem publicar telefone, conteúdo ou credenciais em logs.

Propor painel operacional com taxa de falha por etapa, idade da pendência mais antiga, tentativas de recuperação, latência e gasto por mídia. Teste sintético deve usar grupo e dados próprios e não criar despesas reais.

## 7. Arquitetura para crescer sem reescrita prematura

Arquitetura observada: administração e demonstração/receptor em projetos Vercel; identidade Supabase; backend e dados no Sites com Workers, D1 e R2; Evolution para entrada e Groq para áudio/imagem. O conector local antigo deve ser identificado como legado ou contingência após confirmar a topologia efetiva. A documentação antiga de dependência do computador não deve orientar a operação atual sem essa revisão.

Evoluções propostas:

- Reunir componentes compartilhados hoje copiados entre app principal e projetos administrativos, preservando separação de permissões da demonstração. Definir uma fonte e processo de distribuição verificável.
- Separar apresentação, autorização, domínio financeiro e acesso a dados; substituir `any` nos contratos críticos e padronizar schemas de validação.
- Normalizar vínculos de pessoas com obras quando necessário; hoje ficam em JSON no usuário. Revisar constraints de tipos/estados e integridade de referências antes de aumentar mutações.
- Usar IDs estáveis para categorias, mantendo histórico de renomeações; hoje categoria é texto no lançamento.
- Definir contratos versionados para recepção, mídia e extração, com testes de compatibilidade.
- Manter migrations e estado implantado rastreáveis; testar mudanças com dados representativos sem expor produção.
- Medir latência, volume, concorrência e custo antes de decidir migrar D1/R2 para outra plataforma.
- SaaS para múltiplas empresas exige projeto próprio: organização em entidades, índices e autorização; isolamento de arquivos, eventos, identidade e cobrança; migração e testes de acesso cruzado. Não basta adicionar seletor de empresa.

## 8. Backlog priorizado

Prioridades: P0 protege integridade ou recuperação; P1 consolida o uso diário; P2 amplia valor; P3 prepara expansão. Esforço relativo: P pequeno, M médio, G grande; não representa prazo fechado. IDs permitem futura discussão sem executar automaticamente.

| ID | Prioridade | Entrega | Esforço | Dependência / conclusão verificável |
| --- | --- | --- | --- | --- |
| B01 | P0 | Eliminar corte invisível de pendências (F01) | M | Mais de 500 mensagens, antigas revisáveis |
| B02 | P0 | Aprovação concorrente consistente com auditoria (F02) | M | Uma decisão efetiva e conflito explícito |
| B03 | P0 | Máquina de estados de pagamento (F03) | M | Sem regressão silenciosa ou dupla aplicação |
| B04 | P0 | Entrada durável e recuperação de processamento (F05) | G | Interrupção não perde evento aceito |
| B05 | P0 | Backup e restauração conjunta banco/arquivos | M | Ensaio isolado com valores e hashes conferidos |
| B06 | P0 | Validação compartilhada entre canais (F04) | M | Datas e referências inválidas recusadas |
| B07 | P1 | Indicadores com origem, idade e alertas | M | Desconexão e atraso distinguíveis |
| B08 | P1 | Política de recuperação além de 24h (F06) | M | Reprocessar autorizado sem duplicidade |
| B09 | P1 | Unificar limites e suporte de arquivos (F07) | P | Tela e API concordam |
| B10 | P1 | Triagem: despesa, operacional, descarte e esclarecimento | G | Toda mensagem tem saída auditável |
| B11 | P1 | Delegar conferência por obra (F08) | M | Matriz cargo/obra homologada |
| B12 | P1 | Correção e cancelamento auditados (F10) | G | Histórico e totais consistentes |
| B13 | P1 | Editar cadastros, acessos e ciclo de obra | M | Revogação e encerramento coerentes |
| B14 | P1 | Paginação, filtros e agregações no servidor (F09) | G | Carga representativa dentro da meta acordada |
| B15 | P1 | Atualizar CI e documentação (F12) | M | Todos os serviços críticos verificados |
| B16 | P1 | Convite, recuperação de conta e política MFA | M | Acesso e recuperação testados por perfil |
| B17 | P1 | Matriz de autorização e revisão de segurança | M | Rotas e arquivos testados com acessos negados |
| B18 | P1 | Homologar áudio, imagem e falhas no fluxo atual | M | Casos reais controlados com destino conferido |
| B19 | P2 | Conversa de esclarecimento e confirmação WhatsApp | G | Resposta ligada à pergunta correta, sem loops |
| B20 | P2 | Diário de obra estruturado | G | Ocorrência e execução sem despesa fictícia |
| B21 | P2 | Materiais e logística | G | Quantidade/unidade e vínculo opcional à despesa |
| B22 | P2 | Relatórios por fornecedor/categoria/responsável | M | Mesmos resultados no CSV e painel |
| B23 | P2 | Vencimentos, parciais, adiantamentos e reembolsos | G | Modelo e regras aprovados antes de desenvolver |
| B24 | P2 | Avaliação e evolução da extração inteligente | G | Qualidade medida antes/depois em base de referência |
| B25 | P2 | Revisão visual, móvel e acessibilidade | M | Tarefas reais e navegação por teclado verificadas |
| B26 | P2 | Notificações e responsáveis por pendência | M | Destinatário correto e frequência controlada |
| B27 | P2 | Retenção, privacidade e ciclo dos arquivos | M | Políticas e operação de exclusão documentadas |
| B28 | P2 | Fonte compartilhada de UI e contratos tipados | G | Builds separados sem divergência de regra |
| B29 | P3 | Orçamento e previsto versus realizado | G | Categorias de custo e linha de base definidas |
| B30 | P3 | Produto para múltiplas construtoras | G | Projeto de isolamento e piloto de segunda empresa |

## 9. Sequência proposta e marcos de saída

### Marco A — operação íntegra e recuperável

Abrange B01–B09 e B15, B17–B18 conforme dependências. Começar com integridade das transições, pendências acessíveis, backup e teste completo da mídia; desenhar a fila antes de implantá-la. Não requer repetir o teste de texto que o usuário já confirmou.

Saída: mensagem recebida tem destino rastreável; falha transitória é recuperável; decisão concorrente não gera histórico falso; restauração foi demonstrada; indicador de conexão informa a idade do dado.

### Marco B — equipe opera sem concentrar tudo no proprietário

Abrange B10–B14, B16, B22, B25–B27. Definir política de cargos antes de delegar; correção/cancelamento antes de tratar fechamento financeiro como confiável.

Saída: cada perfil conclui suas tarefas; pendências têm responsável; mensagem sem natureza financeira sai corretamente da conferência; relatórios explicam valores e estados.

### Marco C — gestão operacional e inteligência mensurada

Abrange B19–B24 e B28. Começar pelo diário e materiais que a PST realmente envia; montar avaliação antes de escolher extrator mais amplo.

Saída: texto, áudio ou imagem podem gerar tipos de registro adequados; o sistema pede esclarecimento rastreável; qualidade e custo de interpretação são conhecidos.

### Marco D — expansão do produto

Abrange B29–B30 somente após comprovar adoção e continuidade. Avaliar demanda, isolamento, suporte e custo por empresa. Nenhuma migração está decidida por este relatório.

## 10. Indicadores e plano de validação

Medir uma linha de base antes de prometer ganho. Metas iniciais para aprovação de negócio, não resultados já alcançados:

| Indicador | Definição / direção desejada |
| --- | --- |
| Mensagem aceita com destino rastreável | 100% dos eventos aceitos têm estado persistente e correlação |
| Duplicação de lançamento | Zero em repetição e concorrência dos cenários homologados |
| Tempo até conferência | Mediana e p95 por obra; reduzir frente à linha de base |
| Pendência mais antiga | Sempre visível e com responsável; prazo definido pela PST |
| Erro de valor e obra | Medido contra revisão humana, com atenção especial a valores incorretos |
| Correção por campo | Percentual de propostas em que humano alterou valor, obra, data ou descrição |
| Custo por mídia e despesa concluída | Incluir retentativas, chamadas externas e tempo humano |
| Recuperação após falha | Eventos recuperados sem perda/duplicidade; tempo observado |
| Backup restaurável | Sucesso de ensaio, idade da cópia e integridade de banco/arquivos |
| Adoção | Usuários ativos por papel e tarefas concluídas sem auxílio |

Cenários mínimos de homologação futura: texto válido, texto incompleto, entrega sem preço, áudio com ruído, áudio acima do limite, imagem legível/ilegível, PDF, obra divergente, remetente desativado, usuário de outra obra, mensagem repetida, duas aprovações simultâneas, pagamento repetido, expiração durante revisão, falha Groq, falha do backend, reinício do processamento, recuperação de evento antigo, mais de 500 mensagens e restauração de backup.

Separar testes de domínio, integração com dados isolados, ponta a ponta por perfil, carga e recuperação. Registrar data, versão, entradas sintéticas, resultado esperado e observado. Testes de funcionamento não substituem revisão de segurança ou política de acesso.

## 11. Decisões para a próxima rodada de planejamento

Estas decisões não interrompem a entrega documental e não autorizam execução:

1. Quem confere, quem aprova e quem informa/revisa pagamento em cada obra?
2. Qual processo permite corrigir, cancelar e reabrir registros?
3. Quais três relatos operacionais são mais frequentes na PST?
4. Qual prazo de conferência e qual perda/tempo máximo de recuperação são aceitáveis?
5. Que informações cada funcionário pode consultar, além de enviar?
6. O sistema deve responder em grupo, em privado ou somente no painel?
7. Quais volumes reais de mensagens, áudios, imagens e usuários devem orientar capacidade e orçamento?

Recomendação final de planejamento: tratar o próximo ciclo como **consolidação operacional**, com entregas pequenas e critérios de saída, preservando a base existente. A confirmação de conexão e texto de hoje é um avanço registrado; o foco passa a ser integridade, recuperação, trabalho da equipe e valor operacional medido.
