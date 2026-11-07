# Zapiobra - identificacao de obra por proximidade

Implementado em 07/11/2026 no painel administrativo Vercel.

## Como usar

1. Abrir Obras ou Configuracoes no painel.
2. O proprietario abre Configurar localizacao das obras e seleciona uma obra ativa.
3. Estando no local, toca em Usar meu local atual como referencia, ou informa latitude e longitude manualmente.
4. Ajusta o raio (20 a 2.000 metros; sugestao inicial 150 m), confere e salva.
5. A equipe toca em Identificar minha obra, permite a localizacao e confirma a sugestao. A selecao manual permanece disponivel.
6. A obra selecionada preenche o novo lancamento e os filtros de lancamentos.

Nenhuma coordenada real foi presumida ou cadastrada durante a implementacao. A primeira configuracao deve usar o local confirmado da obra.

## Comportamento

- Consulta pontual de GPS, somente por toque; sem rastreamento continuo.
- Sugestao usa apenas obras ativas autorizadas ao usuario pelo backend atual.
- A posicao da pessoa e comparada no navegador, sem ser enviada ou armazenada para identificar a obra.
- Cadastro explicito do ponto da obra e persistido em armazenamento privado, compartilhado entre dispositivos.
- Referencias podem ser desativadas sem apagar a configuracao.
- Boa sugestao exige precisao ate 100 m e circulo de precisao inteiramente dentro do raio da obra.
- Obras proximas, precisao baixa, permissao negada, localizacao desatualizada, timeout e ausencia de obra proxima mantem escolha humana.
- Nenhuma obra e selecionada automaticamente pelo GPS.

## Arquitetura e acesso

Implementacao em deployment/admin-app. A API /api/project-locations reutiliza a sessao e consulta /api/data pelo proxy administrativo existente antes de ler ou gravar.
Somente proprietario pode configurar coordenadas. Leitura filtra obras autorizadas e ativas.
Referencias persistidas em Vercel Blob privado, store zapiobra-project-locations, conectado ao projeto sendobra-admin. Credencial somente no servidor; arquivos nao sao publicos.
Um arquivo por obra, leitura consistente sem cache e controle ETag impedem sobrescrita concorrente. Historico privado limitado a 20 versoes anteriores identifica o responsavel por cada mudanca.
O backend Sites/D1 e os fluxos de WhatsApp e financeiro nao foram alterados.

## Verificacao

- Seis testes de geolocalizacao/API: limites, distancia, ambiguidade, autorizacao, sessao, versao e concorrencia.
- Teste de sessao administrativa.
- TypeScript e build administrativo.
- Verificacao real de armazenamento: gravacao, leitura imediata e rejeicao de ETag antigo; arquivo sintetico removido.
- GPS real e permissao em aparelho fisico ainda precisam de validacao com o usuario na obra.

Esta entrega implementa geolocalizacao no painel existente. O campo de mensagens, gravacao de audio e envio por link foi estudado e permanece uma etapa separada.

Publicacao de producao concluida em 07/11/2026: https://zapiobra-admin.vercel.app/ . Build remoto aprovado. Rota nova recusou acesso sem sessao (HTTP 401); login respondeu HTTP 200.


## Atualizacao: cadastro por CEP, endereco e mapa

Fluxo principal em Obras > Configurar localizacao das obras: selecionar obra, informar CEP e tocar em Buscar CEP, preencher numero/lote/quadra, conferir ou ajustar o ponto no mapa e confirmar antes de salvar. O endereco estruturado fica junto ao ponto da obra no armazenamento privado.

Consulta de CEP por ViaCEP e BrasilAPI, somente por toque, sem autocomplete. Coordenadas do CEP sao aproximadas e podem estar ausentes. Nunca sao tratadas como local exato do numero informado. O usuario pode tocar no mapa ou arrastar o marcador. Sem ponto disponivel, ha link externo para consultar o endereco e opcao de coordenadas/GPS.

Mapa Leaflet com tiles OpenStreetMap, atribuicao visivel, cache HTTP normal, sem prefetch ou uso offline. NEXT_PUBLIC_MAP_TILE_URL permite trocar o provedor de tiles.

Doze testes de sessao, geolocalizacao e endereco passaram, incluindo falha de provedores, CEP invalido e coordenadas ausentes. TypeScript aprovado. A experiencia de permissao GPS e arraste no celular real ainda precisa de verificacao.

