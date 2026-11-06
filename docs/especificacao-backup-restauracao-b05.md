# B05 — Backup e restauração conjunta de banco e arquivos

Especificação proposta v1.0 — 05/11/2026, America/Sao_Paulo.

Status: planejamento documental. Não foram feitos backup, exportação de produção, restauração, alteração de credenciais ou publicação. Relacionada a B05 do [plano de evolução](plano-evolucao-2026-11-05.md).

## 1. Objetivo

Recuperar o SENDOBRA com seus lançamentos, mensagens, usuários, permissões, auditoria e comprovantes coerentes entre si. Uma cópia do código ou uma exportação CSV não satisfaz esse objetivo.

Exemplo: após perda do banco e dos arquivos, restaurar uma cópia validada em ambiente isolado, conferir valores e vínculos, testar acesso privado e só então planejar a retomada. Nunca substituir o banco de produção para descobrir se uma cópia funciona.

## 2. Evidências e limites

Fontes revisadas: `db/schema.ts`, `drizzle/`, `docs/runbook.md`, `docs/security.md`, `docs/online-deployment.md`, código de anexos/recepção e diagnóstico geral.

O runbook registra necessidade de exportação de D1/R2 e afirma que CSV não é backup completo. Não há evidência nesta análise de política automatizada, armazenamento independente, recuperação pontual ou ensaio completo de restauração já realizados.

A arquitetura atual usa backend/dados Sites com Workers, D1 e R2; administração/receptor na Vercel; identidade Supabase; Evolution para WhatsApp e Groq para mídia. Documentos antigos citam fases anteriores e não comprovam a operação atual.

Esta especificação define requisitos e procedimento lógico. Capacidades de exportação, importação, retenção nativa, cópia entre contas e APIs disponíveis ao proprietário ainda precisam ser verificadas na implementação. Não foram pesquisados limites ou preços atuais de fornecedores. Não há comandos prontos de restauração nem garantia de recuperação nativa assumida.

## 3. O que precisa ser protegido

| Conjunto | Conteúdo mínimo | Observação |
| --- | --- | --- |
| Banco de aplicação | Todas as tabelas de usuário e estado de migrations necessário | Não limitar aos lançamentos |
| Objetos privados | Comprovantes manuais e recebidos por WhatsApp, inclusive ainda não vinculados | Incluir objetos referenciados por `attachments` e `whatsapp_receipts` |
| Código e dependências | Commit, lockfiles, manifests e configurações de build | Git é componente de recuperação, não cópia dos dados |
| Implantação | Versões dos serviços, domínio, bindings e variáveis por nome | Valores secretos ficam em custódia separada |
| Autenticação | Referência de projeto/provedor, procedimento de recuperação de contas e vínculos de identidade | Backup de D1 não recria identidades Supabase |
| WhatsApp | Inventário da instância, conta responsável, roteamento, procedimento de pareamento e reentrega | Não presumir que sessão do provedor esteja dentro do backup da aplicação |
| Segredos | Chaves necessárias para restabelecer os serviços | Cofre independente; nunca texto aberto no Git/Obsidian |
| Evidências | Manifesto, checksums, contagens, relatório de validação e ensaios | Podem conter dados sensíveis e exigem acesso restrito |

Inventário atual do schema, a confirmar novamente no dia da execução: `users`, `supabase_user_bindings`, `projects`, `suppliers`, `categories`, `records`, `audit`, `attachments`, `whatsapp_groups`, `whatsapp_senders`, `whatsapp_messages`, `whatsapp_group_directory`, `whatsapp_group_settings`, `whatsapp_group_members`, `whatsapp_group_senders`, `whatsapp_connection`, `whatsapp_receipts`.

Consultar inventário real em cada backup: tabela nova, inclusive operações financeiras e filas futuras, deve entrar automaticamente no escopo ou bloquear a declaração de completude. Não exportar somente esta lista fixa para sempre.

O fluxo atual de áudio retorna transcrição sem guardar o binário original nesse caminho. O backup preserva o que de fato existe; não prometer recuperar áudio que não foi armazenado. Distinguir perda de informação histórica de indisponibilidade momentânea de serviço externo.

## 4. Metas propostas e frequência

| Métrica | Proposta inicial | Como comprovar |
| --- | --- | --- |
| RPO — perda máxima de dados após o ponto recuperável | Até 24 horas | Último ponto completo validado, não horário do último job iniciado |
| RTO — tempo para retomar serviço mínimo definido | Até 4 horas desde declaração do incidente | Ensaio incluindo obtenção das cópias, chaves, validação e retomada controlada |
| Backup de rotina | Pelo menos diário | Agendamento com margem suficiente para concluir dentro do RPO |
| Backup antes de mudança relevante | Antes de migration, alteração estrutural ou migração de armazenamento | Cópia validada anterior à mudança |
| Ensaio | Inicial antes de declarar recuperação pronta; depois mensal e após mudança estrutural | Relatório com tempo e resultados |

São metas para aprovação operacional, não garantias atuais. Uma execução a cada 24 horas, somada ao tempo de conclusão ou a uma falha, pode exceder RPO de 24 horas. O agendamento e a margem devem ser dimensionados com duração medida e alertas.

Retenção proposta para dimensionamento: 14 pontos diários e 8 semanais, preservando o último conjunto validado e pontos sob investigação. Confirmar volume, custo, finalidade e política de retenção antes de habilitar. Não considerar esta proposta exigência legal nem autorização para guardar indefinidamente dados pessoais.

## 5. Consistência do ponto de recuperação

D1 e R2 são componentes distintos; não presumir snapshot atômico conjunto. Copiar banco às 10h e objetos às 11h não prova consistência por si só.

Para o primeiro procedimento verificável, propor janela controlada de suspensão de todas as mutações: painel, recepção, uploads, revisões, decisões, pagamentos e rotinas administrativas. Leituras poderão continuar se a implementação permitir. A suspensão precisa ocorrer no servidor, não apenas esconder botões. Aguardar operações em andamento e confirmar que nenhuma nova gravação entra.

Antes dessa janela, definir como mensagens entrantes serão preservadas. O caminho atual não tem fila durável própria; não presumir que retornar 503 garante reentrega. Validar buffering/reentrega do provedor ou uma captura durável autorizada; na ausência de garantia, comunicar a janela e fazer reconciliação explícita dos envios com a equipe. Sem isso não declarar ausência de perda no período de suspensão.

Durante o estado congelado: obter snapshot consistente do banco por mecanismo suportado, listar e copiar os objetos requeridos, verificar metadados e conteúdo, registrar manifesto e confirmar o conjunto. Não prolongar bloqueio indefinidamente por um backup com falha: registrar conjunto incompleto, decidir encerramento da janela e reconciliar entrada. Nunca marcar esse conjunto como recuperável.

Alternativa futura sem pausa: snapshot de banco, objetos imutáveis/versionados e retenção que garanta existência dos objetos referenciados naquele snapshot, com protocolo de fronteira comprovado. Essa alternativa depende de capacidades e desenho ainda não validados; não é requisito implementado atualmente.

Objetos órfãos não devem ser apagados durante backup. Listá-los separadamente para análise; o conjunto completo deve declarar se copia todo o bucket ou somente o fechamento de objetos referenciados. Arquivos compartilhados entre relações devem ser copiados uma vez sem perder referências.

## 6. Manifesto de backup e integridade

Cada conjunto recebe ID único, estado (`in_progress`, `incomplete`, `validated`) e manifesto contendo:

- Ambiente de origem, início/fim em UTC e ponto de recuperação declarado.
- Método de consistência e evidência da janela/fronteira utilizada.
- Identificação de schema, migrations e commits/versões de cada serviço.
- Tabelas incluídas, contagem por tabela e checksum do artefato do banco.
- Objetos: chave privada, tamanho, hash de conteúdo e relação de origem quando aplicável.
- Total de arquivos/bytes e referências ausentes ou inconsistentes detectadas.
- Inventário de configuração por nome, sem valores secretos.
- Resultado das verificações, local de armazenamento, política de retenção e responsável.

O manifesto não é público. IDs, nomes de arquivos e hashes podem revelar relações e devem ter acesso restrito. Proteger o manifesto contra modificação não detectada; hash guardado junto a um arquivo adulterável não é prova suficiente contra um invasor que substitua os dois.

Verificar SHA-256 de conteúdo; não presumir que ETag é SHA-256. Onde houver hash já registrado, comparar. Divergência de hash ou arquivo referenciado ausente torna o conjunto não íntegro para aquele escopo, sem mascarar como sucesso. Se a origem já estiver inconsistente, conservar evidência e indicar o que é recuperável; reparo é uma decisão separada.

Criptografar em trânsito e em repouso, confirmar permissões do destino e custódia da chave. A chave de decifragem não pode existir somente no computador ou na conta que se pretende recuperar. Registrar teste de decifragem pelo responsável substituto.

## 7. Independência, acesso e retenção

Manter cópia em destino independente da credencial e da falha principal. Um backup no mesmo bucket que possa ser excluído pela mesma credencial não protege adequadamente contra comprometimento dessa credencial.

Selecionar destino somente após verificar acesso autorizado, custo e recursos disponíveis. Requisito: cópia recuperável fora do domínio de falha da origem, com permissões mínimas e proteção contra exclusão acidental/maliciosa adequada ao ambiente. Não afirmar armazenamento imutável ou offline sem configurá-lo e testá-lo.

Contas de backup devem ter leitura da origem e escrita no destino estritamente necessárias; restauração usa acesso controlado distinto quando possível. Registrar acessos, exclusões e ensaios. Não copiar segredos para Markdown, repositório ou nota de projeto.

Remoção por retenção só ocorre após validar existência de outro ponto íntegro e preservar pontos necessários para incidente. Nunca apagar o último conjunto recuperável. Documentar como solicitações de exclusão/retificação afetam backups e como reaplicar correções após restauração para evitar ressuscitar acessos ou dados removidos.

## 8. Responsabilidades

| Papel | Responsabilidade |
| --- | --- |
| Responsável de negócio PST | Aprovar metas/janela, conferir totais e autorizar retomada de produção |
| Operador técnico | Executar cópia/ensaio, validar integridade e preservar evidências |
| Responsável por identidade/segredos | Disponibilizar acesso de recuperação e rotacionar credenciais quando necessário |
| Substituto designado | Demonstrar recuperação sem depender do computador/conta pessoal do operador |

Preencher nomes e canal de contato antes da implantação. Não há pessoa designada automaticamente por este documento. Autorizar o plano documental não autoriza destruir/restaurar produção nem contratar armazenamento.

## 9. Roteiro de ensaio isolado

### Preparação

Selecionar conjunto validado e registrar motivo do ensaio. Criar ambiente isolado privado, sem domínio administrativo de produção, sem webhook real, sem envio de mensagens e sem tarefas agendadas com efeitos externos. Assegurar que bindings, URLs e credenciais não apontam para produção. Não conectar outro receptor ao número real.

Priorizar fixture sintética representativa no primeiro ensaio. Se necessário validar backup real, usar dados mínimos autorizados, acesso restrito e remoção ao final segundo política. Cópia de produção não deve ser disponibilizada por link público ou conta de demonstração.

### Restauração

1. Recuperar manifesto e chave de decifragem com o operador autorizado.
2. Verificar autenticidade/integridade dos artefatos e identificar versão compatível.
3. Provisionar recursos isolados vazios e confirmar alvos absolutos/identificadores antes de escrever.
4. Restaurar schema e dados pelo método suportado, preservando IDs e histórico de migrations.
5. Restaurar objetos nas chaves esperadas; se houver remapeamento, documentar e validar toda referência antes de uso.
6. Instalar código compatível com a cópia; não aplicar migrations posteriores cegamente nem reaplicar migrations já presentes.
7. Configurar identidade de teste e segredos próprios do ensaio. Não criar conta proprietária irrestrita pelo bootstrap em banco incompleto.
8. Executar a reconciliação e os testes de negócio abaixo.
9. Registrar duração, falhas, intervenção manual e resultado; desmontar ou manter privado segundo decisão documentada.

### Reconciliação obrigatória

- Contagens por tabela e integridade de referências.
- Totais financeiros em centavos por obra/tipo/status e estado de pagamento, comparados ao ponto do backup; não comparar com produção atual já alterada.
- Autoria, permissões por obra e identidade vinculada.
- Cadeia mensagem → lançamento → anexo e mensagens/comprovantes ainda pendentes.
- Correspondência entre hashes do manifesto, metadados e bytes restaurados.
- Auditoria, motivos e estados; operações/idempotência futuras se já existirem no schema copiado.
- Fila antiga acessível e ausência de duplicação ao reentregar evento sintético já persistido.
- Arquivo privado abre para ator autorizado e é negado a ator não autorizado.
- Usuários desativados não recuperam acesso por causa do ensaio/restauração.

Verificar 100% dos objetos e referências pelo processo automatizado proposto. Amostragem visual pode complementar, mas não substituir a verificação integral de integridade. Medir duração dessa verificação no RTO.

## 10. Recuperação em incidente real

Este é um roteiro a operacionalizar; execução em produção exige decisão explícita sobre alvo, ponto de recuperação e perda estimada.

1. Declarar incidente e registrar último estado conhecido, horário e responsável.
2. Conter mutações e preservar banco/objetos/logs atuais antes de sobrescrever qualquer coisa. Se credenciais estiverem comprometidas, conter acesso e planejar rotação.
3. Identificar causa: indisponibilidade do provedor, erro de código, migration ou perda/corrupção de dados. Falha de interface não justifica restaurar banco.
4. Selecionar ponto íntegro anterior ao incidente e demonstrar a perda esperada. Cópia mais recente pode conter a corrupção.
5. Restaurar em recursos isolados/de recuperação e executar verificações essenciais.
6. Reconciliar acessos revogados, usuários desativados, exclusões e decisões posteriores ao ponto restaurado antes da abertura.
7. Levantar lacuna de mensagens e lançamentos desde o ponto recuperado. Registrar pendências de recuperação e obter validação humana para dados financeiros.
8. Aprovar tecnicamente e pelo responsável de negócio a troca controlada dos serviços/bindings/domínios necessários.
9. Retomar um único receptor, validar IDs originais e reentrega sem duplicação; manter respostas externas desativadas até confirmar estabilidade quando pertinente.
10. Monitorar e registrar o ponto efetivo recuperado, dados não recuperados e ações posteriores.

A janela de 24 horas do normalizador de mensagens é dependência de B08: eventos antigos não podem ser reapresentados com horário inventado para contornar o controle. Preservar ID/timestamp original e usar procedimento autorizado de recuperação a especificar/implementar.

Uma restauração pode retroceder chaves de idempotência ou registros de mensagens. Sem reconciliação com eventos posteriores e sistemas externos, reentrega pode repetir despesas já tratadas fora do banco restaurado. Não prometer deduplicação histórica de dados ausentes na cópia.

Manter a origem anterior preservada até homologar a retomada. Plano de retorno deve lidar com novas gravações feitas no destino recuperado: não alternar de volta descartando essas gravações. Evitar dois bancos/receptores gravando paralelamente sem estratégia de reconciliação.

## 11. Identidade e dependências externas

Restaurar `supabase_user_bindings` não restaura usuários, senhas, confirmação de e-mail nem configuração de Supabase Auth. Documentar recuperação do projeto de identidade ou procedimento autorizado de revalidação. Não vincular nova identidade a um proprietário só porque o e-mail parece semelhante; preservar os controles de vínculo e auditar recuperação excepcional.

Sessões administrativas criptografadas não são backup de conta. Se a chave de sessão for perdida ou rotacionada, prever novo login. Guardar material de recuperação por cofre autorizado, não guardar cookies de usuários no conjunto de backup.

Evolution requer recuperação própria de instância/pareamento; o estado `connected` copiado do banco é histórico, não prova de conexão atual. O ambiente recuperado deve consultar o provedor e mostrar estado desconhecido/desatualizado até validar. Groq é dependência de processamento, não substitui os dados da aplicação nem prova disponibilidade por presença de chave.

Cenário de perda completa da conta de um provedor pode exceder RTO de 4 horas; registrar isso no ensaio e no plano de continuidade, em vez de considerar o objetivo cumprido com acesso já disponível.

## 12. Alertas e acompanhamento

Propor alertas para: conjunto incompleto, última cópia validada próxima de exceder RPO, hash divergente, objeto ausente, falha de acesso ao destino/chave, exclusão inesperada e ensaio vencido/falho. Definir canal, destinatário, substituto e frequência; nenhum alerta foi habilitado neste trabalho.

Painel operacional deve distinguir “job executado”, “backup validado” e “restauração ensaiada”. Mostrar horário do ponto recuperável e da última validação. Um job verde que copiou só parte dos arquivos não pode indicar recuperação pronta.

## 13. Matriz de validação futura

Todos os cenários são planejados e ainda não executados nesta etapa.

| ID | Cenário | Resultado obrigatório |
| --- | --- | --- |
| R01 | Restaurar banco e objetos sintéticos completos | Contagens, valores, referências e hashes coincidem |
| R02 | Comprovante pendente sem lançamento | Objeto e mensagem preservados e acessíveis na fila |
| R03 | Comprovante já vinculado presente nas duas relações | Uma cópia de bytes, relações corretas e sem duplicação |
| R04 | Objeto faltando na origem ou na cópia | Conjunto não é marcado íntegro; falta identificada |
| R05 | Alteração de bytes no arquivo/exportação | Checksum acusa e restauração não é aprovada |
| R06 | Falha de cópia no meio do processo | Estado incompleto; último backup íntegro preservado |
| R07 | Gravação durante captura | Protocolo bloqueia/draina ou detecta inconsistência; sem falso snapshot |
| R08 | Mensagens chegam na janela de suspensão | Preservação/reentrega comprovada ou lacuna explicitamente reconciliada |
| R09 | Tabela nova não incluída pelo mecanismo | Inventário acusa e bloqueia completude |
| R10 | Perda do computador/credencial principal | Substituto acessa cópia e chave por caminho independente |
| R11 | Credencial da origem comprometida | Cópia independente não é apagável pela mesma credencial |
| R12 | Migração aplicada antes/depois do ponto restaurado | Código/schema compatíveis, sem replay cego de migrations |
| R13 | Acesso de usuário não autorizado ao arquivo restaurado | Negado; nenhum recurso se torna público |
| R14 | Usuário desativado após a cópia | Revogação reconciliada antes de retomar acesso |
| R15 | Auth indisponível ou identidade recriada | Recuperação controlada sem vinculação automática indevida |
| R16 | Evento já presente reenviado | Não cria segundo lançamento |
| R17 | Evento posterior à cópia e acima de 24 horas | Recuperação controlada ou bloqueio explícito; sem alterar timestamp |
| R18 | Cópia recente contém corrupção lógica | Ponto anterior selecionável; perda estimada documentada |
| R19 | Retenção programada | Último conjunto íntegro e ponto sob investigação não são excluídos |
| R20 | Ensaio isolado | Nenhum webhook, mensagem ou gravação chega à produção |
| R21 | Estado conectado antigo restaurado | UI não apresenta como confirmação atual sem verificar |
| R22 | Recuperação cronometrada | RPO/RTO efetivos medidos e comparados às metas |
| R23 | Exclusões/retificações posteriores ao backup | Reconciliação impede reintrodução indevida antes da abertura |
| R24 | Troca de ambiente e retorno após novas gravações | Dados novos preservados; um único destino ativo de gravação |

## 14. Entregáveis e conclusão

Implementação futura deve entregar: inventário completo; método de cópia suportado; destino/chaves independentes; manifesto e verificações; agenda/retenção e alertas; procedimento executável de ensaio; relatório cronometrado; responsáveis designados; plano de incidente e retorno.

B05 só pode ser declarado concluído após restauração conjunta demonstrada, reconciliação aprovada, acesso privado testado, independência da cópia comprovada e metas medidas. Backup disponível sem ensaio continua com recuperação não comprovada. Eventual RPO/RTO não atingido deve ser registrado como limitação, com correção ou decisão de negócio explícita.

Próximo documento recomendado: B18 — homologação de áudio e imagem no fluxo atual, incluindo falhas, duplicatas e destino correto por obra. Esta especificação não declara nenhuma proteção ou garantia operacional nova ativa.
