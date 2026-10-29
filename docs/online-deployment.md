# Preparação para operação online

## Ambiente atual
O painel privado continua em https://sendobra-pst.bergsonchatgpt.chatgpt.site. O código usa Vinext/Cloudflare Workers, D1, R2 e autenticação do Sites. O repositório privado de destino é https://github.com/tidilodo/SENDOBRA.

## GitHub
O workflow verify.yml executa verificações sem segredos de produção e sem publicar automaticamente. O teste financeiro completo, recuperação de dados e primeiro login da nova conta proprietária ainda precisam ser concluídos. Arquivos antigos de diagnóstico são registros históricos, não evidência de disponibilidade atual.

## Vercel
O acesso à conta foi autorizado durante a preparação. Antes de implantar, confirmar a sessão e o escopo. A aplicação atual depende de bindings Cloudflare e identidade fornecida pelo Sites; não deve ser importada como Next.js e considerada pronta sem portar e testar essas dependências.

A migração exige autenticação validada no servidor, banco persistente, armazenamento privado de comprovantes, testes de autorização e upload, migração de dados e plano de retorno. Cabeçalhos de identidade recebidos diretamente da internet não podem substituir autenticação verificada.

## WhatsApp contínuo
A Evolution é uma opção para substituir o conector local em servidor com armazenamento persistente. Ainda não foi instalada nem validada neste projeto. O payload e a autenticação de seus webhooks exigem um adaptador para a API assinada existente; não basta apontar o webhook para /api/whatsapp.

Antes de ativar: selecionar conta e orçamento de hospedagem; configurar HTTPS, segredos, volumes, banco e cache privados; testar reinício e reconexão, deduplicação, remetentes permitidos, atraso de eventos e restauração de backup. Não conectar dois receptores ao mesmo número durante a migração sem um plano de transição.

Manter as respostas desligadas conforme solicitado. Implementar a seleção de obra por mensagem antes de liberar o grupo geral. n8n é opcional para automações futuras.

Nenhum serviço pago está autorizado por este documento. A contratação depende de uma proposta concreta e aprovação de orçamento.
