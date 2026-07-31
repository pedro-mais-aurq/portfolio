import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/**
 * Vitrine de projetos — vincula o progresso do scroll vertical ao
 * deslocamento horizontal da faixa de cases, sem sequestrar a roda do
 * mouse (nenhum preventDefault). Ao final, o scroll vertical é liberado
 * automaticamente pelo próprio fim do pin do ScrollTrigger.
 *
 * - Desktop (>=1100px): pin completo, progresso vinculado ao scroll.
 * - Tablet (700–1099px): pin com duração reduzida + navegação por
 *   gesto (scroll nativo) e por botões.
 * - Mobile (<700px) ou prefers-reduced-motion: sem pinning, overflow
 *   horizontal nativo com scroll-snap (ver CSS), navegável por botões.
 *
 * Em qualquer modo, o foco por teclado em um card traz a faixa até ele,
 * já que o deslocamento é feito via transform e não via scroll nativo.
 */
export function initVitrine(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>("[data-vitrine-track]");
  const sticky = root.querySelector<HTMLElement>("[data-vitrine-sticky]");
  const prevBtn = root.querySelector<HTMLButtonElement>("[data-vitrine-prev]");
  const nextBtn = root.querySelector<HTMLButtonElement>("[data-vitrine-next]");
  if (!track || !sticky) return;

  const items = Array.from(track.children) as HTMLElement[];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mq = {
    tablet: window.matchMedia("(min-width: 700px) and (max-width: 1099px)"),
    desktop: window.matchMedia("(min-width: 1100px)"),
  };

  let trigger: ScrollTrigger | undefined;
  let mode: "native" | "tablet" | "desktop" = "native";
  let currentIndex = 0;

  const goToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const target = items[clamped];
    if (!target) return;

    if (mode === "native") {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        inline: "start",
        block: "nearest",
      });
      return;
    }

    if (!trigger) return;
    const maxX = track.scrollWidth - sticky.clientWidth;
    if (maxX <= 0) return;
    const targetX = Math.min(target.offsetLeft, maxX);
    const progress = targetX / maxX;
    const scrollTarget =
      trigger.start + progress * (trigger.end - trigger.start);
    gsap.to(window, {
      duration: prefersReducedMotion ? 0 : 0.6,
      scrollTo: scrollTarget,
      ease: "power2.out",
    });
  };

  const step = (dir: 1 | -1) => {
    currentIndex = Math.max(
      0,
      Math.min(items.length - 1, currentIndex + dir)
    );
    goToIndex(currentIndex);
  };

  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  // Navegação por setas do teclado quando o foco está dentro da vitrine
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  });

  // Ao focar um card (Tab), garante que ele fique visível
  track.addEventListener(
    "focusin",
    (e) => {
      const li = (e.target as HTMLElement).closest("li");
      if (!li) return;
      const idx = items.indexOf(li as HTMLElement);
      if (idx === -1) return;
      currentIndex = idx;
      if (mode !== "native") goToIndex(idx);
    },
    true
  );

  const teardownTrigger = () => {
    trigger?.kill();
    trigger = undefined;
    gsap.set(track, { clearProps: "transform" });
  };

  const setupPinned = (pinDurationFactor: number) => {
    teardownTrigger();
    const distance =
      (track.scrollWidth - sticky.clientWidth) * pinDurationFactor;
    if (distance <= 0) return;

    trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: () => `+=${distance}`,
      pin: sticky,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        const maxX = track.scrollWidth - sticky.clientWidth;
        gsap.set(track, { x: -maxX * self.progress });
      },
    });
  };

  const applyMode = () => {
    if (prefersReducedMotion || (!mq.tablet.matches && !mq.desktop.matches)) {
      mode = "native";
      root.dataset.vitrineMode = "native";
      teardownTrigger();
      return;
    }

    if (mq.tablet.matches) {
      mode = "tablet";
      root.dataset.vitrineMode = "tablet";
      setupPinned(0.6); // duração de pin reduzida no tablet
      return;
    }

    mode = "desktop";
    root.dataset.vitrineMode = "desktop";
    setupPinned(1);
  };

  applyMode();

  let resizeTimer: number;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyMode, 200);
  });
}
