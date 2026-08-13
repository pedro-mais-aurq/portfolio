import { initCursor } from "./custom-cursor";
import { initMotion } from "./motion-parallax";
import { initVitrine } from "./vitrine-scroll";

let cleanup: (() => void) | undefined;

function start() {
  cleanup?.();
  const disposers = [
    initCursor(document),
    initMotion(document),
    ...Array.from(document.querySelectorAll<HTMLElement>("[data-vitrine]"))
      .map((root) => initVitrine(root))
      .filter((dispose): dispose is () => void => Boolean(dispose)),
  ];
  cleanup = () => disposers.forEach((dispose) => dispose());
}

function stop() {
  cleanup?.();
  cleanup = undefined;
}

document.addEventListener("astro:page-load", start);
document.addEventListener("astro:before-swap", stop);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
