# Evolution Go → SENDOBRA

O portal Vercel disponibiliza `POST /api/evolution/<chave-exclusiva>` para a instância `tidi` do serviço `https://evo.useia.api.br/`. A URL completa é uma credencial de entrada: configure apenas na instância e não a publique em apresentações ou no repositório.

Variáveis sigilosas na Vercel: `EVOLUTION_WEBHOOK_KEY`, `WHATSAPP_INGEST_SECRET`, `EVOLUTION_INSTANCE_TOKEN` e `GROQ_API_KEY`. Reutiliza `BRIDGE_BACKEND_URL` e `BRIDGE_SERVICE_TOKEN` já configuradas no servidor. O token da instância é usado apenas no servidor para baixar mídias pela API fixa do provedor. A chave Groq da conta já usada pelo motor de áudio habilita transcrição e leitura visual, sem depender do computador local.

Na instância, cadastre a URL fornecida e assine `MESSAGE` e `GROUP` (a grafia pode variar conforme a versão). O receptor aceita envelopes `Message` e `messages.upsert`, com `data.key/message` ou `data.Info/Message`. Valide a versão efetiva com uma mensagem real antes de considerar o fluxo concluído.

Só o grupo de demonstração e o remetente já autorizado são encaminhados. Mensagens próprias, outros grupos, remetentes e instâncias são ignorados. O painel continua privado. Eventos autorizados recebem assinatura HMAC e seguem para `/api/whatsapp`; só recebem confirmação de entrega após a persistência do backend. O identificador original é preservado para deduplicação entre provedores. Falhas transitórias retornam 503 para as tentativas do provedor.

## Limites desta etapa

- Texto usa o comportamento existente do backend, inclusive comandos financeiros estruturados. Use dados fictícios no piloto.
- Áudios de até dois minutos e 10 MB são baixados via `/message/downloadmedia` e transcritos com `whisper-large-v3-turbo`. O texto permanece um evento de áudio para revisão, mesmo se contiver um comando financeiro.
- Imagens JPEG/PNG de até 5 MB são baixadas pela mesma API, validadas pelo formato e lidas com `qwen/qwen3.8-27b`. O original fica privado no armazenamento existente, junto com a leitura para conferência. Nenhum lançamento ou pagamento é confirmado automaticamente. Documento PDF continua como pendência sem processamento.
- O webhook admite até 4 MB no corpo; a plataforma Vercel também impõe seu limite de entrada. Se o provedor embutir base64 de uma mídia grande no evento, use um arquivo menor. O download separado permite processar mídias maiores quando o evento só contém metadados.
- Falhas transitórias retornam 503 para nova tentativa do provedor. Arquivo inválido ou formato não suportado fica como pendência legível. Falha permanente de OCR preserva o comprovante privado. Não há fila durável própria; repetição de eventos pode repetir chamadas de IA, embora o backend impeça duplicação do registro.
- Não envia respostas ao WhatsApp nem altera permissões de usuário.
- GET com a chave correta verifica apenas o receptor e a presença da configuração de mídia; não comprova autenticação no WhatsApp, disponibilidade dos modelos ou entrega até o painel.
- Não mantém conexão por heartbeat e não substitui a futura fila durável de mídia.

Recebimento real de texto pela Evolution confirmado em 30/10/2026 às 13h12 (Brasília), com o teste de Kadu. Áudio e imagem exigem validação de ponta a ponta com novos envios no grupo após ativar a configuração de mídia. O indicador `Connected: true` sozinho não comprova login: também confira `LoggedIn`.

## Verificação

`node --test tests/evolution.test.mjs tests/evolution-media.test.mjs tests/session.test.mjs`, na pasta `deployment/vercel-app`, valida filtros, autenticação, tamanho, janela temporal, assinatura HMAC, mídia e confirmação após persistência, incluindo duplicatas. Testes com amostras fictícias também confirmaram transcrição em português e leitura de um comprovante de R$ 780,00 na conta Groq existente.
