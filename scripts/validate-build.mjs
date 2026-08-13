import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const routes = [
  "dist/index.html",
  "dist/arquivo/index.html",
  "dist/projetos/francino-coifas/index.html",
  "dist/projetos/tamara-imoveis/index.html",
  "dist/projetos/domorelli/index.html",
  "dist/projetos/mathias/index.html",
];

for (const route of routes) await access(resolve(root, route));
await access(resolve(root, "dist/favicon.ico"));
await access(resolve(root, "dist/logo_branca.svg"));

const insightRouteExists = await access(
  resolve(root, "dist/projetos/insight/index.html"),
).then(
  () => true,
  () => false,
);
if (insightRouteExists) {
  throw new Error("Insight não pode gerar rota enquanto for preview");
}

const pages = await Promise.all(
  routes.map(async (route) => ({
    route,
    html: await readFile(resolve(root, route), "utf8"),
  })),
);

const forbidden = [
  /href="\/arquivo(?:[\/#"])/,
  /href="\/projetos(?:[\/#"])/,
  /href="\/#/,
  /\/portfolio\/portfolio/,
];

for (const { route, html } of pages) {
  for (const pattern of forbidden) {
    if (pattern.test(html)) {
      throw new Error(`${route}: link incompatível com base (${pattern})`);
    }
  }
  if (!html.includes('href="/portfolio/favicon.ico"')) {
    throw new Error(`${route}: favicon não respeita /portfolio`);
  }
}

const home = pages[0].html;
for (const channel of ["whatsapp", "email", "instagram"]) {
  if (!home.includes(`data-contact-icon="${channel}"`)) {
    throw new Error(`Ícone de contato ausente: ${channel}`);
  }
}

if (!home.includes("data-vitrine")) {
  throw new Error("Vitrine não encontrada na home");
}
if (!home.includes('href="/portfolio/arquivo/"')) {
  throw new Error("CTA da vitrine não aponta para o Arquivo Completo");
}
if (!home.includes('src="/portfolio/logo_branca.svg"')) {
  throw new Error("Logo original não está usando a base /portfolio");
}

if (!home.includes("data-site-cursor")) {
  throw new Error("Cursor customizado não encontrado");
}
if ((home.match(/data-motion-depth=/g) ?? []).length < 100) {
  throw new Error("Cobertura de motion insuficiente na composição da home");
}
if ((home.match(/data-cursor-theme="dark"/g) ?? []).length < 4) {
  throw new Error("Regiões escuras não estão marcadas para inversão do cursor");
}

const homeOrder = [
  'data-project-id="francino-coifas"',
  'data-project-id="tamara-imoveis"',
  'data-project-id="domorelli"',
  'data-project-id="mathias"',
  "projetos__item--archive",
];
let previousPosition = -1;
for (const marker of homeOrder) {
  const position = home.indexOf(marker);
  if (position < 0 || position <= previousPosition) {
    throw new Error(`Ordem incorreta na vitrine: ${marker}`);
  }
  previousPosition = position;
}

const archive = pages.find((page) => page.route === "dist/arquivo/index.html")?.html;
if (!archive) throw new Error("Arquivo completo ausente");
const completedStart = archive.indexOf('data-archive-group="completed"');
const previewStart = archive.indexOf('data-archive-group="preview"');
if (completedStart < 0 || previewStart <= completedStart) {
  throw new Error("Grupos concluídos/previews ausentes ou fora de ordem");
}
const completedGroup = archive.slice(completedStart, previewStart);
const previewGroup = archive.slice(previewStart);
if (
  !completedGroup.includes('data-archive-project="domorelli"') ||
  completedGroup.includes('data-archive-project="insight"') ||
  !previewGroup.includes('data-archive-project="insight"') ||
  previewGroup.includes('href="/portfolio/projetos/insight/"') ||
  !archive.includes("04 projetos") ||
  !archive.includes("01 prévia")
) {
  throw new Error("Separação ou contagem do Arquivo Completo está incorreta");
}

const vitrineSource = await readFile(
  resolve(root, "src/scripts/vitrine-scroll.ts"),
  "utf8",
);
if (
  !vitrineSource.includes("ScrollTrigger.create") ||
  !vitrineSource.includes("pin: sticky") ||
  !vitrineSource.includes("track.scrollWidth - sticky.clientWidth") ||
  !vitrineSource.includes('mode = "desktop"')
) {
  throw new Error("Scroll lock desktop da vitrine está incompleto");
}
const dragThresholdPosition = vitrineSource.indexOf(
  "Math.abs(delta) < DRAG_THRESHOLD",
);
const pointerCapturePosition = vitrineSource.indexOf("track.setPointerCapture");
if (
  dragThresholdPosition < 0 ||
  pointerCapturePosition < dragThresholdPosition
) {
  throw new Error("Pointer capture deve ocorrer somente depois do limiar de drag");
}

for (const icon of ["whatsapp", "email", "instagram"]) {
  const iconSource = await readFile(
    resolve(root, `src/assets/icons/${icon}.svg`),
    "utf8",
  );
  if (!iconSource.includes("<svg") || !iconSource.includes("currentColor")) {
    throw new Error(`SVG puro de contato inválido: ${icon}`);
  }
}

const motionSource = await readFile(
  resolve(root, "src/scripts/motion-parallax.ts"),
  "utf8",
);
if (
  motionSource.includes("Math.random") ||
  !motionSource.includes("dataset.motionX") ||
  !motionSource.includes("dataset.motionY") ||
  !motionSource.includes('addEventListener("blur"')
) {
  throw new Error("Sistema vetorial de motion está incompleto ou não determinístico");
}

const cursorSource = await readFile(
  resolve(root, "src/scripts/custom-cursor.ts"),
  "utf8",
);
if (
  cursorSource.includes("elementFromPoint") ||
  cursorSource.includes("cursorTone") ||
  !cursorSource.includes("requestAnimationFrame(render)") ||
  !cursorSource.includes('addEventListener("pointermove"') ||
  !cursorSource.includes('addEventListener("scroll"') ||
  !cursorSource.includes('addEventListener("blur"')
) {
  throw new Error("Cursor por inversão local está incompleto");
}

const globalStyles = await readFile(
  resolve(root, "src/styles/global.css"),
  "utf8",
);
if (
  !globalStyles.includes("mix-blend-mode: difference") ||
  !globalStyles.includes("background: #fff") ||
  globalStyles.includes('data-cursor-tone="dark"')
) {
  throw new Error("CSS do cursor não usa inversão real com fonte branca");
}

const caseSource = await readFile(
  resolve(root, "src/pages/projetos/[slug].astro"),
  "utf8",
);
if (
  !caseSource.includes("case__header-grid") ||
  !caseSource.includes("<ProjectPreview") ||
  !caseSource.includes("width: min(72vw, 21rem)") ||
  !caseSource.includes("max-width: 68ch")
) {
  throw new Error("Composição editorial dos cases está incompleta");
}

const previewSource = await readFile(
  resolve(root, "src/components/ui/ProjectPreview.astro"),
  "utf8",
);
if (
  !previewSource.includes('data-project-preview={state}') ||
  !previewSource.includes("<iframe") ||
  !previewSource.includes('loading="lazy"') ||
  !previewSource.includes('rel="noopener noreferrer"') ||
  previewSource.includes("previewImage ?? cover")
) {
  throw new Error("Arquitetura de preview live/image/fallback está incompleta");
}

const contentSchema = await readFile(
  resolve(root, "src/content.config.ts"),
  "utf8",
);
if (
  !contentSchema.includes('z.enum(["live", "image"])') ||
  !contentSchema.includes("previewImage: image().optional()")
) {
  throw new Error("Metadata retrocompatível de preview não encontrada");
}

for (const { route, html } of pages.filter((page) => page.route.includes("/projetos/"))) {
  if (
    !html.includes("case__header-grid") ||
    !/data-project-preview="(?:live|image|empty)"/.test(html) ||
    !html.includes("case__body-label")
  ) {
    throw new Error(`${route}: novo layout editorial do case não foi renderizado`);
  }
}

console.log(
  `Validação estática aprovada: ${routes.length} rotas, 5 projetos e 3 contatos.`,
);
