# Portfólio Pedro Neres

Portfólio autoral em Astro, construído como um arquivo editorial japonês contemporâneo. A interface trata os projetos como volumes de uma coleção e usa movimento em baixa amplitude para criar profundidade sem disputar atenção com o conteúdo.

## Requisitos

- Node.js 22.12 ou superior
- npm 10 ou superior

## Comandos

```sh
npm ci
npm run dev
```

Validação e produção:

```sh
npm run check
npm run build
npm run test:static
npm run preview
```

O projeto é publicado com `base: "/portfolio"`. Links internos, favicon, rotas dos cases e arquivo já respeitam esse prefixo.

## Estrutura principal

- `src/components/sections/`: blocos editoriais da home.
- `src/components/ui/`: cards de projeto e ícones vetoriais de contato.
- `src/content/projects/`: dados e conteúdo dos cases.
- `src/data/contact.ts`: fonte única para os canais de contato.
- `src/scripts/motion-parallax.ts`: profundidade vetorial determinística entre 1 e 15 px.
- `src/scripts/custom-cursor.ts`: esfera adaptativa preta/off-white por região.
- `src/scripts/vitrine-scroll.ts`: vitrine com scroll lock no desktop e navegação horizontal nativa nos demais modos.
- `scripts/validate-build.mjs`: smoke test de rotas, ordem editorial, status e contatos.

## Comportamento responsivo

- Mobile: uma coluna, navegação editorial compacta e swipe horizontal nativo.
- Tablet: cards com largura controlada, scroll-snap e botões de navegação.
- Desktop: `ScrollTrigger` fixa a vitrine e converte o percurso vertical no deslocamento horizontal dos volumes; setas e teclado continuam ativos.
- `prefers-reduced-motion`: motion ambiental desativado, cursor preciso e vitrine nativa.

## Curadoria dos projetos

- Concluídos: 001 Francino Coifas, 002 Tâmara Neres, 003 Domorelli Steakhouse e 004 MATHias.
- Prévia: 006 Insight.
- Somente projetos com `status: "completed"` geram páginas de case.
- `/arquivo` calcula os grupos e contadores diretamente da content collection.

## Pendências de conteúdo

- Os textos internos de Francino, Tâmara e MATHias ainda estão marcados como provisórios no conteúdo.
- Domorelli recebeu a capa e as únicas informações editoriais fornecidas; detalhes de processo e resultados não foram inventados.
- Insight usa a capa fornecida e permanece sinalizado como prévia, sem rota de case.
- PS Munnin, Mael e outros volumes não foram adicionados sem material correspondente.
- As legendas japonesas e os direitos de uso das ilustrações devem ser confirmados antes da publicação comercial.
- O WhatsApp usa o DDI brasileiro `55`, coerente com o telefone de Belo Horizonte informado na referência; confirme o número final antes da publicação.

## Atualização de contato

Edite apenas `src/data/contact.ts`. O bloco de contato e o epílogo consomem os mesmos dados para impedir divergências.
