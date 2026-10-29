# Operação contínua e processamento — análise de 29/10/2026

## Estado desta entrega

Análise dos pontos 3 e 4. Nenhum daemon, servidor, plano pago ou novo provedor de IA foi ativado. Os pontos 1 e 2 permanecem pendentes: a tentativa de alterar o acesso administrativo não foi executada. O painel administrativo privado atual continua disponível no Sites; a apresentação do cliente continua na Vercel.

## Ponto 3: custo de tirar a dependência deste computador

O conector usa atualmente arquivos locais de sessão e fila SQLite. O motor de áudio também é local e usa o serviço de transcrição Groq. A operação contínua exigiria manter um conector por número, externalizar a sessão e a fila, prever recuperação e publicar o QR pelo painel privado. Os Daemons ainda não oferecem disco persistente nem entrada HTTP; o servidor local de pareamento não pode ser transferido sem adaptação.

A documentação atual informa instâncias mínimas de 1 GiB, com 2 GiB como padrão. A franquia Hobby de daemons é 420 GB-horas/mês: uma instância contínua de 1 GiB consumiria aproximadamente 730 GB-horas num mês médio. Portanto, essa franquia não sustenta o mês inteiro. Ao esgotar a cota, os daemons são interrompidos. Fonte: https://vercel.com/docs/daemons/limits

### Cenário de referência, em dólares

Hipóteses: 730 horas/mês, uma instância, menor tarifa publicada, memória a US$ 0,0212/GB-hora e CPU ativa a US$ 0,128/hora. Cinco horas de CPU ativa são uma hipótese para cálculo, não uma medição do consumo real.

| Cenário | Memória mensal | CPU ativa hipotética | Computação bruta mensal |
| --- | ---: | ---: | ---: |
| Um daemon de 1 GiB | US$ 15,48 | US$ 0,64 | US$ 16,12 |
| Um daemon de 2 GiB | US$ 30,95 | US$ 0,64 | US$ 31,59 |

Esses números não são a fatura total. A região pode alterar as tarifas. Fonte: https://vercel.com/pricing

O Pro parte de US$ 20/mês e inclui US$ 20 de crédito de uso. Se esse crédito estivesse integralmente disponível, o cenário menor caberia nele; o maior chegaria a aproximadamente US$ 31,59 somando a mensalidade e o excedente. Se outros projetos já consumirem o crédito, o custo incremental muda. Não foi confirmado o plano nem o consumo atual da conta. Fontes: https://vercel.com/pricing e https://vercel.com/docs/plans/pro-plan

Não incluídos: impostos, câmbio, banco/fila externa, armazenamento de sessão, tráfego, registro de imagens, chamadas de funções, outros projetos da conta e interpretação de dados/OCR. O banco e os comprovantes atuais continuam no serviço privado existente; sua cobrança não foi auditada aqui. Logo, não há base para apresentar um total fechado da solução.

### Transcrição

O modelo já utilizado pelo motor, whisper-large-v3-turbo no Groq, tem preço de lista de US$ 0,04 por hora de áudio, com mínimo faturável por requisição. Como exemplo, 1.000 áudios de 30 segundos somam cerca de 8,33 horas: aproximadamente US$ 0,33 de transcrição antes de franquias e retentativas. Isso não inclui o processamento de interpretação nem a hospedagem. Fontes: https://console.groq.com/docs/speech-to-text e https://console.groq.com/docs/model/whisper-large-v3-turbo

### O que precisa ser validado antes de contratar

- Plano e créditos efetivamente disponíveis na conta.
- Região e memória contratável para o daemon.
- Custo do armazenamento durável de sessão e da fila.
- Troca de implantação sem duas conexões concorrentes no mesmo número.
- Reconexão, recuperação de fila e restauração sem perder eventos.
- Consumo de CPU e memória sob carga real.

Uma leitura do processo local encontrou aproximadamente 36,4 MB de working set no Node do conector e 4,9 MB no Python do motor. Trata-se de uma observação pontual do Windows, sujeita a paginação, e não de teste de carga nem dimensionamento de container.

## Ponto 4: pode avançar sem o ponto 3?

Sim. Disponibilidade do receptor e interpretação dos dados são responsabilidades separadas. O backend e o armazenamento já estão online. Enquanto este computador recebe as mensagens, podemos desenvolver o processamento dos eventos que ele entrega.

Fluxo proposto:

1. Registrar mensagem e texto original/transcrição no JSON existente.
2. Produzir uma proposta estruturada: tipo de registro, obra, data, valores e descrição, ou os campos de Diário de Obra.
3. Validar o resultado com schema estrito, datas reais, centavos e obras cadastradas. Campos desconhecidos permanecem nulos.
4. Sinalizar informações faltantes e possíveis duplicidades, preservando a origem.
5. Apresentar a proposta para conferência humana.
6. Criar o registro uma única vez e aplicar as permissões de aprovação, sem confirmação bancária automática.

Mensagens já guardadas na nuvem podem ser interpretadas mesmo se o computador estiver desligado. A chegada de novas mensagens continuará dependendo do conector local até que o ponto 3 seja implantado.

### Entregas independentes da operação contínua

- Schema de negócio para despesa, recebimento, materiais e Diário de Obra.
- Revisão de dados antes de virar lançamento.
- Identificação de obra por mensagem, substituindo a regra atual de uma obra fixa por grupo.
- Administrativo geral explícito, sem inferir por ausência de obra.
- Correspondência sugerida entre relato em texto, transcrição e comprovante.
- Extração de imagem com revisão, quando um provedor e seu orçamento forem escolhidos.
- Registro de confiança, dúvidas, correções, versões e motivos de rejeição.

A interpretação assistida por IA não foi ativada nesta análise. A transcrição existente continua sendo uma etapa anterior: ela transforma áudio em texto, mas não extrai todos os dados de negócio. O custo da interpretação depende do modelo, volume de tokens e quantidade de imagens; isso exige orçamento próprio.

## Próxima decisão concreta

Concluir um fluxo supervisionado de mensagem para proposta, conferência, lançamento e aprovação no painel privado existente. A hospedagem contínua pode ser contratada depois da validação de persistência, custo e recuperação. Nenhuma execução do ponto 3 está autorizada por este documento.
