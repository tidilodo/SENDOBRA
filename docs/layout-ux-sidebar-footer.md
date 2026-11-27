# Melhoria de UX/UI — Barra Lateral e Rodapé (20/11/2026)

## 1. Motivação e Diagnóstico
Em telas de monitores desktop e laptops (especialmente em resoluções inferiores a 1080p ou com escala/zoom de DPI do sistema operacional ativada), a barra lateral esquerda (`aside`) apresentava altura superior à viewport, provocando uma barra de rolagem vertical indesejada na janela principal do navegador e prejudicando a experiência de uso. Além disso, o rodapé (`footer`) possuía espaçamento excessivo (`margin-top: 35px`) e tipografia que esticavam a área útil.

## 2. Decisões de Arquitetura de Interface

### A. Barra Lateral com Rolagem Interna e Base Fixa
- **Container `aside`:** Altura travada em `100vh` com `overflow: hidden;` e posicionamento fixo (`position: fixed; inset: 0 auto 0 0;`).
- **Navegação `nav`:** Isolada com `flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;`. Caso a quantidade de itens ultrapasse a viewport, apenas o menu de botões rola suavemente com scrollbar sutil (`scrollbar-width: thin; scrollbar-color: #2a5056 transparent`).
- **Zona de descanso (`padding-bottom: 18px`):** Adicionado espaçamento na base da navegação interna para que o último item (*Configurações*) nunca fique colado nem encoberto pelo painel de usuário.
- **Bloco de perfil fixo (`.aside-bottom`):** Configurado com `flex-shrink: 0;` e margens equilibradas para permanecer sempre visível e cravado no rodapé da sidebar.

### B. Rodapé Singelo e Área de Trabalho Flexível
- **Container `.workspace` & `main`:** Configurados com flexbox de altura total (`min-height: 100vh; display: flex; flex-direction: column;`), fazendo o `<main>` preencher `flex: 1`. O rodapé se posiciona de forma natural na base sem estourar altura quando o conteúdo da tela for menor.
- **Espaçamento de respiro:** O container `<main>` recebeu `padding-bottom: 24px`, garantindo descanso visual confortável antes do rodapé.
- **Footer minimalista:** Margem superior reduzida de `35px` para `20px`, espaçamento interno de `12px` e layout horizontal fluido (`display: flex; justify-content: space-between; align-items: center;`).

## 3. Arquivos Alterados no Repositório
- `app/globals.css` (Aplicação principal Cloudflare/Next)
- `deployment/admin-app/app/globals.css` (Painel administrativo Vercel)
