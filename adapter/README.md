# Adaptador WhatsApp · piloto supervisionado

Processo Node separado do Sites. Não iniciado automaticamente. Nunca usa o site público demonstrativo. Somente grupo permitido; sem busca de conversas, backfill ou download de mídia. Respostas automáticas desabilitadas por padrão. Baileys é não oficial e experimental.

## Preparar
Node 22.13+ (Node 24 recomendado). `npm ci` nesta pasta. Criar `.env` local ignorado com SENDOBRA_SITE_URL (URL operacional privada), WHATSAPP_INGEST_SECRET (mesmo segredo no Worker), SITES_SERVICE_TOKEN (credencial de serviço privada Sites), WHATSAPP_ALLOWED_GROUP_ID (JID exato do grupo). Nunca colar segredos no chat. Não usar token de Git como credencial de serviço.

Configurar o segredo no servidor pelas ferramentas Sites. Sem ele a API retorna 503. O acesso privado Sites precisa de credencial de serviço; a assinatura HMAC é uma segunda verificação e não substitui essa barreira. Não tornar o sistema público para contornar a autenticação.

Criar uma obra de teste no painel privado, cadastrar o JID do grupo e vínculos de remetentes em Configurações. O ID do grupo pode ser obtido pelo link de identificação técnica do conector/provedor ou por ferramenta local autorizada; este adaptador não enumera outros grupos. Se não houver ID confiável, não iniciar ingestão.

## Parear e testar
`npm start`; abrir http://127.0.0.1:8790. No WhatsApp do número dedicado: Aparelhos conectados > Conectar aparelho. Escanear QR local, sem compartilhar. O adaptador só inicia após validar a configuração mínima. Envie mensagem de teste no grupo permitido; o JID exato do remetente aparece apenas nessa página local para vínculo no painel. Primeira mensagem sem cadastro retorna 403 e não gera registro. Após autorizar o remetente, envie uma NOVA mensagem.

Comando inicial: `/despesa 10,50 | 2026-10-22 | material de teste`. Não usa IA. Para receber confirmações automáticas no grupo, ativar WHATSAPP_SEND_REPLIES=1 apenas quando o responsável autorizar esses envios ao grupo de teste. Áudio/imagem/documento geram orientação para texto; bytes de mídia não são baixados. Nenhum comando administrativo por WhatsApp.

## Persistência e falhas
Sessão e fila ficam fora do repositório em ~/.sendobra/whatsapp-pilot. Contêm chaves de conta e payloads pendentes: restringir permissões do diretório no sistema operacional e criptografar o disco. Auth por arquivos serve somente ao piloto; produção exige armazenamento de sessão endurecido e backup definido. Fila SQLite com ID único, retentativas limitadas a cinco, dead-letter em failed e reinício persistente. Payload de evento confirmado é removido; metadados de deduplicação permanecem. Erros 4xx definitivos não são reenviados. Respostas com envio incerto exigem revisão manual. Reconexão tem limite e backoff; logout/conflito encerra tentativas, sem apagar sessão.

Limites: sem áudio/OCR/IA, sem reprocessamento administrativo na interface, sem restauração certificada. Nenhuma conexão real pode ser afirmada antes do pareamento/teste. Computador deve permanecer ligado durante o piloto. Não há hospedagem externa contratada.
`n## Descoberta local do grupo antes de configurar o servidor`nApós criar exatamente o grupo SENDOBRA · Teste, definir WHATSAPP_DISCOVERY_ONLY=1 em .env e executar npm start. Nesse modo não são exigidos segredos de backend, não há encaminhamento nem envio de mensagens. Parear pelo QR local e atualizar a página; apenas o ID do grupo com esse nome será exibido. Outros nomes de grupos não são exibidos ou enviados. Parar com Ctrl+C após copiar o ID. Não é necessário compartilhar o QR no chat.
