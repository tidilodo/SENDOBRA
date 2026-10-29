# Evolution Go → SENDOBRA

O portal Vercel disponibiliza `POST /api/evolution/<chave-exclusiva>` para a instância `tidi` do serviço `https://evo.useia.api.br/`. A URL completa é uma credencial de entrada: configure apenas na instância e não a publique em apresentações ou no repositório.

Variáveis sigilosas na Vercel: `EVOLUTION_WEBHOOK_KEY` e `WHATSAPP_INGEST_SECRET`. Reutiliza `BRIDGE_BACKEND_URL` e `BRIDGE_SERVICE_TOKEN` já configuradas no servidor. O token da instância Evolution não é necessário para receber eventos e não fica no código nem no navegador.

Na instância, cadastre a URL fornecida e assine `MESSAGE` e `GROUP` (a grafia pode variar conforme a versão). O receptor aceita envelopes `Message` e `messages.upsert`, com `data.key/message` ou `data.Info/Message`. Valide a versão efetiva com uma mensagem real antes de considerar o fluxo concluído.

Só o grupo de demonstração e o remetente já autorizado são encaminhados. Mensagens próprias, outros grupos, remetentes e instâncias são ignorados. O painel continua privado. Eventos autorizados recebem assinatura HMAC e seguem para `/api/whatsapp`; só recebem confirmação de entrega após a persistência do backend. O identificador original é preservado para deduplicação entre provedores. Falhas transitórias retornam 503 para as tentativas do provedor.

## Limites desta etapa

- Texto usa o comportamento existente do backend, inclusive comandos financeiros estruturados. Use dados fictícios no piloto.
- Áudio, imagem e documento entram apenas como metadados e pendência. Esta ponte ainda não baixa, transcreve ou interpreta arquivos da Evolution. O motor de áudio local continua separado.
- Não envia respostas ao WhatsApp nem altera permissões de usuário.
- GET com a chave correta verifica apenas o receptor; não comprova autenticação no WhatsApp, assinatura de eventos na instância ou entrega até o painel.
- Não mantém conexão por heartbeat e não substitui a futura fila durável de mídia.

Configuração na instância e teste real ainda precisam ser confirmados pelo operador. O indicador `Connected: true` sozinho não comprova login: na consulta de 29/10/2026 o serviço retornou `LoggedIn: false`.

## Verificação

`node --test tests/evolution.test.mjs tests/session.test.mjs`, na pasta `deployment/vercel-app`, valida filtros, autenticação, tamanho, janela temporal, assinatura HMAC e confirmação após persistência, incluindo duplicatas.
