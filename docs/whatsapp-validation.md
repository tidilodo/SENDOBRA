# Etapa WhatsApp — resultado de verificação
- Sete testes de domínio/autorização/HMAC passaram; um teste do filtro do adaptador passou.
- TypeScript sem erros e Worker compilado.
- API e D1 locais: configuração por proprietário, assinatura, janela anti-replay, grupo/remetente autorizados, valores em centavos, criação, deduplicação sequencial e concorrente, esclarecimento sem inventar dados, mídia não processada, heartbeat e auditoria verificados.
- Baileys instalado e importado com sucesso; NENHUM pareamento ou recebimento real de WhatsApp foi executado.
- Produção: não há segredo de ingestão configurado nesta etapa; endpoint retorna 503. Não há bot em execução ou hospedagem externa contratada.
- Acesso do Site operacional foi encontrado público e restaurado a custom somente proprietário, seguindo a orientação de preservá-lo privado. A demonstração pública não foi alterada.
- Para o piloto: criar grupo SENDOBRA · Teste, parear localmente em modo descoberta, cadastrar grupo/obra/remetentes e configurar duas credenciais (serviço Sites e HMAC) com segurança. Nunca usar token Git para acesso à API.
