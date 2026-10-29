# SENDOBRA na Vercel — ambiente de demonstração

O painel de demonstração está em deployment/vercel-app e usa Next.js na Vercel. O armazenamento D1/R2 e a ingestão WhatsApp continuam no backend privado do Sites. O painel administrativo original permanece no Sites. Esta é uma implantação híbrida do piloto, não uma transferência do armazenamento para a Vercel.

## Acesso e limites
- Conta fixa: tidilodo@gmail.com, perfil funcionário, somente PILOTO-WA e DEMO-HORIZONTE.
- Convite com segredo aleatório, validade de 14 dias e sessão assinada de até 8 horas, cookie HttpOnly/Secure/SameSite.
- A ponte não aceita e-mail ou cargo do chamador. Ela resolve a conta fixa no banco, exige funcionário ativo e vínculos exclusivamente com as obras fictícias.
- Somente consulta de dados/testes e criação de lançamento pendente em obra fictícia. Sem gestão de usuários, aprovação, configuração WhatsApp ou alteração de acesso.
- Fotos e áudios são enviados pelo grupo autorizado; o painel recebe os resultados via backend privado. O conector e o Alquimia Audio Engine ainda dependem deste computador.
- A identificação automática de dados/obra e OCR continuam pendentes. Novos eventos preservam texto original/transcrição em um envelope JSON; eventos antigos têm um envelope de compatibilidade, sem inventar texto original ausente.

## Segredos
Variáveis server-side configuradas como sensíveis na Vercel: BRIDGE_BACKEND_URL, BRIDGE_SERVICE_TOKEN, BRIDGE_SIGNING_SECRET, SESSION_SIGNING_SECRET, ACCESS_EMAIL, ACCESS_CODE_HASH, ACCESS_EXPIRES_AT. Nenhum valor fica no Git ou em NEXT_PUBLIC_. O código do convite não deve ser enviado a terceiros além do cliente autorizado. O fragmento do convite preenche o código e é removido do endereço antes do login.

No Sites: VERCEL_BRIDGE_SECRET e VERCEL_TEST_USER_EMAIL; os outros segredos permanecem preservados. A audiência privada do Sites não foi ampliada para o cliente.

## Verificação e operação
Testes de sessão em deployment/vercel-app/tests; testes reais de Worker/D1/R2 em tests/vercel-bridge-integration.mjs e tests/vercel-inbox-integration.mjs usando banco local isolado. O segundo teste depende do estado fictício criado pelo primeiro. Verificação de telefone/grupo é separada desses testes.

Atualizações da UI compartilhada precisam ser copiadas para deployment/vercel-app/app antes do build. Não copiar rotas cloudflare:workers para a Vercel. Não importar o projeto raiz diretamente na Vercel. Atualizações podem ser publicadas com a CLI a partir de deployment/vercel-app. Ainda não existe implantação automática da Vercel por push; GitHub Actions verifica o código.

Para revogar o piloto: desativar a conta do cliente no painel original e remover/rotacionar o hash do convite na Vercel, com redeploy. Desativar a conta bloqueia as chamadas ao backend mesmo que uma sessão do navegador ainda esteja válida.
