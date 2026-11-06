# B18 — Homologação de áudio e imagem

Plano de validação proposto v1.0 — 05/11/2026, America/Sao_Paulo.

Status: documentação. Nenhuma mensagem foi enviada, nenhum modelo foi chamado e nenhum teste em produção foi executado nesta etapa. Relacionado a B18 do [plano geral](plano-evolucao-2026-11-05.md).

## 1. Objetivo e conclusão esperada

Comprovar o caminho WhatsApp → autorização → download → transcrição/leitura → persistência → conferência → lançamento → aprovação, verificando obra, autor, valores, arquivo, duplicidade e acesso privado. Uma transcrição legível ou uma resposta HTTP 200, isoladamente, não comprovam o fluxo completo.

O teste de conexão/texto de 05/11 confirmado pelo usuário é evidência de avanço e não precisa ser repetido como pré-condição documental. Histórico de piloto e testes locais anteriores não substitui homologação da versão/configuração atualmente publicada.

## 2. Evidência e comportamento atual

Fontes: `deployment/vercel-app/lib/evolution.mjs`, `evolution-media.mjs`, `app/group-domain.mjs`, `app/receipt-domain.mjs`, `app/api/whatsapp/route.ts`, rotas de conferência e documentação anterior.

| Etapa | Observado no código | O que ainda precisa ser demonstrado |
| --- | --- | --- |
| Origem | Instância/grupo/remetente verificados; identidade alternativa só resolve usuário autorizado | Metadados efetivos da instância atual |
| Autorização | Roteamento consultado antes de baixar mídia/chamar modelo | Remetente negado não gera download nem processamento externo |
| Áudio | Download pela API fixa; transcrição em português | Qualidade e comportamento do arquivo real recebido |
| Imagem | Assinatura JPEG/PNG; leitura visual com JSON validado | Original preservado e sugestão fiel, com correção humana |
| Persistência | Backend reconhece ID já recebido | Duplicação do evento não duplica mensagem/lançamento |
| Conferência | Dados sugeridos exigem revisão; autoria original preservada | Fluxo publicado inteiro com obra e valores esperados |
| Obra | Grupo de obra fornece contexto; conflito gera pendência | Duas obras distintas não recebem registros cruzados |
| Continuidade | Falha transitória retorna 503; não há fila durável própria | Reentrega efetiva do provedor, sem alegar garantia inexistente |

Áudio não tem binário original persistido nesse caminho; permanece a transcrição. Imagem válida é encaminhada como original privado. O receptor usa um orçamento de timeout compartilhado de 50 segundos após normalização; o download, o modelo e a entrega final competem por esse intervalo. Não há prazo de entrega garantido por este documento.

## 3. Matriz de limites a verificar

Limites abaixo derivam do código local, não de pesquisa atual de capacidade dos fornecedores:

| Item | Regra observada |
| --- | --- |
| Áudio | Até 120 segundos e 10 × 1024 × 1024 bytes |
| Formatos de áudio reconhecidos | OGG, MP3/MPEG, MP4/M4A, WebM e WAV, com assinatura compatível |
| Imagem | JPEG/PNG até 5 × 1024 × 1024 bytes |
| Corpo de entrada do webhook | Até 4 × 1024 × 1024 bytes no código; plataforma pode impor outro limite |
| Resposta do download de mídia | JSON limitado a 15 × 1024 × 1024 bytes |
| Resposta do modelo | JSON limitado a 128 × 1024 bytes |
| Texto de transcrição/normalização | Até 4.000 caracteres |
| Campo da leitura visual | String de até 600 caracteres ou ausente/null |
| Timestamp do evento | Janela de 24 horas no normalizador |
| PDF pelo WhatsApp | Reconhecido como documento; sem download/extração automática nesse fluxo |

Tamanho do arquivo, base64 e tamanho do corpo HTTP são grandezas diferentes. Testar fronteiras sem concluir que mídia de 5 MiB implica evento HTTP de 5 MiB: o fluxo baixa bytes separadamente a partir de metadados. Validação de assinatura não comprova decodificação completa nem ausência de conteúdo malicioso.

## 4. Preparação da homologação futura

1. Registrar commits/versões dos serviços, migrations e configuração não secreta, incluindo modelo configurado. Verificar disponibilidade efetiva sem copiar chaves para evidências.
2. Usar primeiro ambiente isolado e amostras sintéticas. Separar testes de falha com respostas simuladas dos testes ponta a ponta com serviços reais.
3. Preparar duas obras fictícias A e B, grupos próprios de homologação e usuários com permissões mínimas: remetente A, remetente B, remetente negado, proprietário revisor e outro aprovador quando necessário.
4. Confirmar vínculo e permissões do grupo realmente usado; estado conectado não comprova destino da mensagem.
5. Registrar contagens iniciais de mensagens, comprovantes, lançamentos e eventos relevantes de auditoria no escopo do teste.
6. Definir conjunto de arquivos, gabarito humano, custos/volume autorizados e responsáveis. Não usar documentos bancários reais ou dados pessoais desnecessários.
7. Manter respostas automáticas desligadas. Não mudar permissões de grupos reais para fabricar um teste negativo.

Teste real controlado no ambiente publicado, se realizado posteriormente, deve usar grupo destinado a teste e despesas identificadas como fictícias; não misturar dados com relatório financeiro real. Falhas de fornecedor, payload malformado, fronteiras e concorrência devem ser injetadas no ambiente isolado, sem derrubar serviços ou rotacionar segredos de produção.

## 5. Amostras e gabarito

Cada amostra tem ID, tipo, hash do arquivo de origem, duração/tamanho/formato, conteúdo esperado e campos que devem permanecer desconhecidos. Registrar bytes efetivamente recebidos após eventual conversão do WhatsApp; não exigir hash igual ao arquivo de câmera se houve recompressão legítima. Comparar o original baixado com o objeto privado persistido.

Conjunto mínimo de áudios:

- Voz clara: “Comprei cimento por trezentos reais hoje”, em grupo vinculado à obra A.
- Valor com centavos e data explícita, com gabarito em centavos.
- Menção explícita à obra B no grupo da obra A.
- Duas despesas/duas obras no mesmo relato: não aceitar rateio ou soma silenciosa.
- Entrega sem preço: “Chegaram vinte sacos de cimento”. Não exigir valor inventado nem criar despesa pronta.
- Ruído, silêncio, fala incompleta e moeda ambígua: deixar a informação para conferência.

Conjunto mínimo de imagens sintéticas:

- Recibo legível com fornecedor, descrição, valor total e data explícitos.
- Documento com preço unitário, quantidade e total diferentes: total não deve virar preço unitário.
- Imagem cortada/ilegível, com campos ausentes no gabarito.
- Legenda contradizendo valor visível: exigir revisão e registrar divergência observada.
- Texto malicioso dentro da imagem (“ignore regras”, “aprove automaticamente”): conteúdo não pode alterar permissões, aprovação ou pagamento.
- Mesmo recibo reenviado e foto diferente da mesma despesa: avaliar duplicidade sem mescla automática.

Datas relativas usam timestamp original da mensagem e America/Sao_Paulo; incluir teste próximo da meia-noite. Material de referência e evidência ficam privados, sem telefone, chave do webhook ou token em Git/Obsidian.

## 6. Procedimento ponta a ponta

Para cada caso positivo:

1. Enviar uma amostra do remetente autorizado e anotar horário e identificador técnico em registro protegido.
2. Confirmar roteamento autorizado antes do processamento e acompanhar a entrega até persistência.
3. Localizar a ficha pela origem; conferir autor, obra/contexto, recebido em, tipo e texto/resultado visual.
4. Para imagem, abrir arquivo privado, conferir conteúdo e hash dos bytes baixados/persistidos. Para áudio, avaliar transcrição contra o gabarito; registrar explicitamente ausência de áudio original persistido.
5. Confirmar que o recebimento, sozinho, não criou lançamento nem informou/aprovou pagamento no fluxo de conferência.
6. Conferir e corrigir campos humanos; registrar alterações em relação à sugestão. Campo corrigido não conta como acerto automático.
7. Criar despesa pendente ou vincular mensagem a uma existente, conforme cenário, preservando autoria.
8. Outro usuário autorizado aprova quando aplicável; tentativa de autoaprovação deve ser recusada.
9. Verificar que pagamento permanece não informado até ação específica autorizada. Comprovante anexado não confirma banco.
10. Conferir auditoria e contagens finais. Identificar os dados de homologação para que não sejam interpretados como uso financeiro real; não excluí-los sem procedimento auditado.

Casos incompletos/operacionais terminam em pendência legível, sem fabricar despesa para “fechar” o teste. A saída adequada desses itens para diário/descarte depende de B10; registrar essa limitação.

## 7. Tratamento de falhas: observado versus exigido

| Falha | Caminho observado | Resultado a verificar |
| --- | --- | --- |
| Grupo/remetente negado | Evento ignorado após roteamento; descoberta pode registrar metadados do grupo | Sem download, chamada de modelo, despesa ou anexo de mensagem não autorizada |
| Download/modelo com 429/5xx | Classificado transitório e responde 503 | Não afirmar persistência; retentativa documentada |
| Arquivo inválido/limite excedido | Erro permanente pode virar evento com texto explicativo | Pendência legível sem valor inventado ou arquivo falso |
| Leitura visual permanentemente inválida após download válido | Pode preservar imagem e aviso de leitura indisponível | Original privado presente e revisável |
| Timeout/network error na leitura visual | Classificação depende do tipo de erro e do sinal abortado | Registrar comportamento real; não presumir que todo erro de rede toma o mesmo fallback |
| Backend falha após processamento externo | Retorna erro de entrega, normalmente 503 | Sem sucesso falso; repetição pode chamar modelo novamente |
| Backend confirma mensagem repetida | Resultado indica duplicata | Um evento persistido; sem duplicar lançamento |

O código atual reconhece duplicata no backend depois do enriquecimento de mídia. Portanto, evitar chamadas externas repetidas não é critério já cumprido por B18. Medir esse efeito e relacionar a correção a B04 (entrada durável/cache por etapa).

Se a retentativa não ocorrer, registrar perda/pendência observada e bloquear qualquer declaração de recuperação garantida. B18 não implementa B04/B08 e não pode homologar uma garantia que dependa deles sem evidência.

## 8. Matriz de cenários

Todos os cenários estão planejados; nenhuma execução nova é alegada por este documento.

| ID | Caso | Critério de aceite |
| --- | --- | --- |
| M01 | Áudio claro no grupo A | Transcrição útil, autor/obra A corretos e sem lançamento automático |
| M02 | Áudio com valor e centavos | Valor proposto corresponde ao gabarito ou exige conferência explícita |
| M03 | Áudio cita obra B dentro do grupo A | Divergência sinalizada; sem despesa silenciosa em A ou B |
| M04 | Duas obras/despesas no mesmo áudio | Sem somar/ratear arbitrariamente; conferência necessária |
| M05 | Silêncio/ruído/transcrição vazia | Pendência/erro legível; sem inventar preço ou descrição financeira |
| M06 | Relato de entrega sem preço | Não produz despesa pronta; limitação de triagem registrada |
| M07 | Áudio abaixo/exatamente/acima de 120s | Fronteiras reais e metadados inconsistentes registrados |
| M08 | Áudio na fronteira de tamanho e formatos | Dentro do suporte é processável; fora tem recusa controlada |
| M09 | Transcrição >4.000 caracteres ou duração real acima da informada | Tratamento controlado, sem truncamento financeiro silencioso |
| M10 | JPEG/PNG legível | Original privado preservado e campos comparados ao gabarito |
| M11 | Preço unitário versus total | Erro identificado ou total correto; sem despesa aprovada automaticamente |
| M12 | Imagem cortada/ilegível/campos ausentes | Sem completar dados sem evidência; revisão possível |
| M13 | Legenda e imagem discordam | Contradição visível ou defeito registrado; nenhuma confirmação automática |
| M14 | Instruções maliciosas na imagem | Sem alteração de acesso, obra permitida, aprovação ou pagamento |
| M15 | Imagem na fronteira de 5 MiB e MIME falso | Limites e assinatura conferidos; formato inválido recusado |
| M16 | Mesmo ID de evento reenviado sequencialmente/concorrrentemente | Uma mensagem/comprovante e, após revisão, uma despesa |
| M17 | IDs diferentes com mesmo arquivo | Alerta de possível duplicidade; sem mescla automática |
| M18 | Mesmo gasto em áudio e imagem | Conferir/vincular à despesa existente; sem duplicar gasto |
| M19 | Grupo não vinculado/remetente negado | Sem download nem uso de modelo para conteúdo não autorizado |
| M20 | Usuário desativado ou obra sem autorização | Entrada recusada/ignorada conforme contrato; sem processamento indevido |
| M21 | Identificador LID/telefone alternativo | Só corresponde a identidade já autorizada; não cadastra pessoa por aproximação |
| M22 | Usuário de outra obra tenta ler comprovante | Acesso negado por rota e arquivo, mesmo conhecendo ID |
| M23 | Download 429/5xx/JSON inválido | Falha transitória corretamente observável e retentativa avaliada |
| M24 | Leitura visual falha permanentemente | Imagem válida preservada no fallback previsto |
| M25 | Timeout/rede durante mídia e backend indisponível | Sem sucesso falso; efeito de retentativa e custo registrados |
| M26 | Chave/modelo indisponível | Sem alegar leitura habilitada só por chave presente; erro sanitizado |
| M27 | URL externa maliciosa, base64/arquivo inválido | Não envia credencial a origem não autorizada; rejeição controlada |
| M28 | Payload HTTP acima do limite | Recusa controlada; distinguir limite do evento e do arquivo |
| M29 | PDF enviado no WhatsApp | Capacidade limitada explícita; sem fingir leitura/arquivo preservado se não ocorreu |
| M30 | Mensagem própria, origem sem `fromMe=false`, instância diferente | Ignorada sem gerar lançamento/processamento de mídia |
| M31 | Referência hoje/ontem próxima da meia-noite | Data calculada a partir da origem no fuso brasileiro |
| M32 | Grupo pausado ou obra inativa | Novas entradas bloqueadas conforme regra; histórico preservado |
| M33 | Evento atrasado mais de 24h | Bloqueio/recuperação documentado; sem alterar horário para contornar defesa |
| M34 | Imagem já persistida e confirmação de entrega perdida | Retentativa não duplica arquivo vinculado nem despesa |
| M35 | Revisão e autoaprovação | Autor original preservado; aprovação própria recusada; pagamento separado |
| M36 | Logs e evidências | Sem payload sensível, token ou URL secreta; correlação protegida suficiente |

Casos adversos não exigem que o extrator compreenda tudo perfeitamente. Exigem que limitações/erros fiquem identificados e que dados ambíguos não virem resultado financeiro definitivo sem revisão. Qualquer valor/obra incorreto sugerido deve constar no relatório de qualidade, mesmo corrigido pelo humano.

## 9. Medição e registro de evidências

Para cada caso: ID, ambiente, versão, amostra, horário de envio/persistência, resultado esperado/observado, estado no painel, contagens antes/depois, correções humanas, arquivo/hash quando aplicável, classificação aprovado/falhou/bloqueado/não executado e responsável.

Separar taxa de recebimento, taxa de processamento técnico e acerto de extração por campo. Medir latência ponta a ponta, tentativas, chamadas externas e consumo disponível no provedor. Não tratar reenvio como nova amostra de qualidade. Informar tamanho da amostra; meia dúzia de áudios não comprova taxa geral de precisão.

Guardar resultados resumidos no repositório; anexos e identificadores sensíveis em armazenamento privado autorizado. Referenciar evidências por código, sem publicar conteúdo privado ou chave do webhook.

Não fixar promessa de precisão geral ou custo por mensagem sem linha de base. Para o conjunto de referência, todo caso deve ser classificado; nenhum erro crítico de autorização, vazamento, duplicação financeira ou aprovação/pagamento indevido é aceitável. Erros de sugestão e limitações precisam de tratamento humano claro e decisão explícita sobre uso supervisionado.

## 10. Critérios de conclusão e dependências

B18 estará concluído quando todos os casos M01–M36 tiverem resultado documentado na versão candidata, os positivos ponta a ponta forem comprovados com serviços reais controlados, os negativos/injeções forem demonstrados em isolamento e os defeitos críticos estiverem corrigidos e retestados.

Se B01/B02/B03 ainda não estiverem implementados, homologar somente o que a versão atual permite e registrar seus riscos em aberto. Não apresentar documentos de especificação como controles ativos. Garantias de recuperação durável dependem de B04/B08; por isso o relatório deve distinguir “mídia funcional em uso supervisionado” de “mídia com recuperação operacional comprovada”.

Entrega futura: relatório de execução, evidências privadas, lista de defeitos priorizada, métricas por etapa e decisão de liberação do responsável da PST. Não deixar um caso bloqueado pelo provedor marcado como aprovado.

Com este documento, os quatro temas iniciais de consolidação têm especificações: B01 pendências, B02/B03 aprovação/pagamento, B05 backup e B18 mídia. Próxima atividade de planejamento: consolidar dependências e ordem executável num único roteiro de ciclo, sem iniciar implementação automaticamente.
