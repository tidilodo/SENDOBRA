# SENDOBRA — PST Construtora

Gestão de obras com entrada pelo WhatsApp e revisão financeira em painel privado.

## Estado atual em 04/11/2026

- **Publicado.** O painel privado roda no Sites com Cloudflare Workers, D1 e R2. A Vercel hospeda a demonstração com acesso restrito às obras fictícias e o receptor da Evolution Go.
- **Gestão.** O painel reúne obras, equipe, fornecedores, categorias, lançamentos, aprovações, comprovantes privados, auditoria e exportação CSV.
- **WhatsApp.** A equipe seleciona o grupo em **Obras → Gerenciar WhatsApp**, escolhe a obra e autoriza os remetentes pelo painel. Cada grupo novo identifica sua obra. Uma divergência de obra fica para conferência. O grupo geral do piloto foi preservado.
- **Recebimento.** Texto, áudio transcrito e leitura de imagens já foram validados no piloto. As propostas chegam à Conferência. A despesa passa por aprovação e o pagamento é registrado separadamente. A autoaprovação é bloqueada.
- **Operação.** O painel mostra o último recebimento e as pendências por obra. Pausar um grupo bloqueia novas entradas e preserva o histórico. As respostas automáticas nos grupos estão desligadas.
- **Validação.** O piloto registrou uma despesa aprovada de R$ 23,60 com comprovante vinculado e pagamento não informado. A versão de grupos passou em 41 testes automatizados e em uma integração local com dois grupos fictícios. Em produção, o webhook do piloto aceitou o evento técnico e reconheceu a repetição como duplicata.
- **Próxima etapa.** Conectar a primeira obra real e testar o vínculo com uma mensagem fictícia do remetente autorizado. Depois, validar a reconexão da Evolution, alertas de falha e restauração de backup antes de ampliar o uso financeiro.

[Painel privado](https://sendobra-pst.bergsonchatgpt.chatgpt.site/) · [Demonstração](https://sendobra.vercel.app/)

## Documentação

- [Vincular grupos às obras](docs/whatsapp-groups-by-project.md)
- [Conferência, aprovação e pagamento](docs/expense-review-flow.md)
- [Webhook da Evolution Go](docs/evolution-webhook.md)
- [Demonstração na Vercel](docs/vercel-demo.md)

