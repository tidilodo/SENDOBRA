# Arquitetura e ADR 001
A solicitação confirmou publicação Sites. Adotados Workers + D1 + R2 nativos em vez de PostgreSQL/Supabase/Vercel. As migrations Drizzle são versionadas e aplicadas pelo Sites. D1 não oferece RLS PostgreSQL: todas as operações usam autorização de servidor por identidade, cargo e obra. Isolamento é de uma organização por Site. Não expandir para SaaS multitenant sem redesenho.
Baileys mantém conexão persistente e precisa de serviço externo separado. IA/transcrição são pendências sem provedor escolhido. Não simular recepção nem extração.
