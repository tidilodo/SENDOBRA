# Mensagem → conferência → aprovação

O receptor Evolution marca os novos eventos com `expense_flow: 1`. No backend, texto, transcrição e leitura de comprovante são organizados por regras locais. Esta etapa não adiciona um envio do texto a uma API externa. Os serviços de áudio e imagem já autorizados continuam com o funcionamento anterior.

## Operação

1. Enviar uma despesa fictícia no grupo geral, pelo número autorizado. Exemplo: “Comprei cimento por R$ 300,00 para a obra Residência Horizonte hoje”.
2. Na Vercel, Demonstração → Mensagens recebidas mostra obra, valor, data, fornecedor e perguntas pendentes. Esta conta permanece limitada à demonstração e não aprova despesas.
3. No painel proprietário privado do Sites, abrir Conferência. Conferir a mensagem original, corrigir os campos e selecionar uma obra autorizada ao remetente.
4. Confirmar a revisão cria um lançamento com o autor original, status `pending_approval` e pagamento `unreported`.
5. Em Aprovações, outro usuário com a permissão adequada aprova ou rejeita. Ninguém aprova a própria despesa.
6. Pagamento é informado e revisado separadamente; o envio de comprovante não altera o estado bancário.

## Regras

- O grupo autoriza a recepção; ele não escolhe uma obra padrão neste fluxo. Um remetente precisa ter ao menos uma obra ativa autorizada e só pode gerar despesa em suas obras.
- A obra deve estar explicitamente citada e corresponder a uma única obra autorizada. Ausência, conflito ou obra desconhecida permanecem pendentes. Administrativo geral só é usado se explicitamente indicado e se houver uma obra ativa com esse nome e autorização adequada.
- Datas explícitas e referências hoje/ontem usam a data original da mensagem no fuso America/Sao_Paulo. Sem data, permanece pendente.
- A extração local reconhece valores explícitos em reais, alguns valores falados por extenso e rótulos extraídos de comprovantes. Valores contraditórios, centavos ambíguos e entradas fora dos formatos reconhecidos exigem correção humana. Não se trata de interpretação geral por IA.
- Várias obras não são rateadas automaticamente. O responsável precisa separar as despesas e confirmar que cada ficha representa uma única despesa em uma única obra.
- Fornecedor e categoria podem ficar não informados / sem categoria. Não há criação automática desses cadastros.
- Mesmo conteúdo de comprovante, ou mesma obra/valor/data, gera alerta de possível duplicidade. É possível vincular a mensagem a um lançamento existente, preservando o arquivo, sem criar outra despesa. Uma despesa distinta exige confirmação explícita.
- A revisão usa condições de gravação e uma identificação exclusiva por revisão para impedir duplicação e auditoria falsa em pedidos concorrentes, inclusive entre a tela nova e a revisão anterior de comprovantes.
- A caixa de entrada e os arquivos vinculados respeitam a obra do lançamento final. Um participante autorizado apenas em outra obra do grupo geral pode acompanhar os próprios envios; isso não abre acesso administrativo.
- JSON e texto original permanecem internos e rastreáveis. A demonstração apresenta uma ficha legível.

## Verificação

33 testes de domínio e integração do receptor passaram. `tests/expense-integration.mjs`, contra um Worker com as APIs reais e D1/R2 locais isolados, validou: recepção sem lançamento automático, conferência restrita, preservação de autor, aprovação separada, autoaprovação negada, comprovante privado, vínculo sem duplicidade, acesso por obra, submissão/vínculo concorrentes e revisão concorrente entre endpoints.

Nenhuma despesa real foi criada para validar a implementação. A inspeção visual em navegador não estava disponível nesta execução; os formulários foram compilados e o comportamento de gravação foi validado por API.
