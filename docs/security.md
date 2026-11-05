# Segurança
O painel administrativo na Vercel autentica e-mail e senha pelo projeto Supabase dedicado. A sessão usa cookie HttpOnly, Secure e SameSite=Strict com conteúdo criptografado e validade limitada ao token. A API do backend verifica o usuário diretamente no Supabase e vincula a identidade confirmada ao cadastro ativo existente. O vínculo é único por usuário e por identidade Supabase. Cargo e obras vêm do banco do SENDOBRA.

O acesso de serviço da Vercel permite alcançar o backend privado, mas cada operação administrativa também exige o token do usuário validado. Tokens inválidos, contas sem cadastro e contas desativadas são recusados. A demonstração continua com sua autorização restrita às obras fictícias.

Sites privado restringe entrada ao proprietário autenticado. Headers de identidade são fornecidos pelo dispatch Sites. Nunca expor este Worker fora dessa fronteira sem verificação criptográfica própria. Primeiro proprietário criado apenas no Site privado vazio. Usuários posteriores vinculam identidade por e-mail cadastrado pelo proprietário.
Verificação servidor por obra/cargo; autoaprovação proibida. Financeiro em centavos inteiros. CSRF por Origin. Arquivos PDF/JPEG/PNG até 10MB, assinatura MIME conferida, SHA256, download autenticado e auditado, sem URL pública. Auditoria e mutação usam batch D1 atômico. Não há segredos no navegador. Revisão documental não confirma banco.
Pendentes: revisão independente de segurança, política LGPD/retenção, antivírus, limites de taxa dedicados, restauração de produção. Não ampliar audiência sem revisar permissões e piloto.
