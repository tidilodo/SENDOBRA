# Grupos do WhatsApp por obra

1. Cadastre a obra no SENDOBRA.
2. Adicione o número dedicado ao grupo correspondente no WhatsApp.
3. No painel proprietário, abra **Obras → Gerenciar WhatsApp** ou **Configurações → Conectar grupo à obra**.
4. Atualize a lista, selecione o grupo e carregue os participantes. Se a lista da Evolution não responder, envie uma mensagem curta de identificação pelo grupo e atualize a lista de grupos detectados.
5. Selecione o participante pelo nome ou número e associe à pessoa já cadastrada. A pessoa precisa ter acesso à obra. Autorize somente quem deve enviar dados e salve o vínculo.
6. Envie uma mensagem de teste e confira a obra, o último recebimento e as pendências no painel. Use **Conferência** para revisar os dados antes de enviá-los para aprovação.

Cada grupo vinculado sugere sua obra sem exigir que ela seja dita no áudio. Se o conteúdo citar outra obra ou um nome que não possa ser confirmado, a ficha fica com a obra em aberto. O painel não envia mensagens aos clientes. Participar do grupo não dá acesso ao painel.

**Pausar** bloqueia novas mensagens do grupo e preserva os registros e comprovantes anteriores. O grupo geral do piloto mantém o comportamento e os remetentes que já estavam em produção. Novos grupos usam autorização por participante; não é necessário editar ou publicar código para incluí-los.

## Verificação e ordem de publicação

1. Publicar o Sites, que aplica a migração de esquema e disponibiliza a autorização de entrada.
2. Publicar o receptor na Vercel, preservando a chave e a configuração da Evolution.
3. Verificar o painel de demonstração e a rota de entrada. O primeiro teste com grupos novos deve ser feito sem dados reais.

O teste local `node tests/whatsapp-groups-integration.mjs` usa Worker, D1 e R2 isolados, com dois grupos fictícios e resposta simulada da Evolution. Cobre descoberta, autorizações, divergência de obra, bloqueio de novas mensagens após pausa e acesso aos comprovantes históricos. Os testes em `deployment/vercel-app/tests/` verificam que mídia não autorizada não dispara download, transcrição ou leitura de imagens.
