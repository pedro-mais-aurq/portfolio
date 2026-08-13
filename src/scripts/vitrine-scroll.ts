import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DRAG_THRESHOLD = 7;
type VitrineMode = "native" | "tablet" | "desktop";

export function initVitrine(root: HTMLElement) {
  if (root.dataset.vitrineReady === "true") return;

  const track = root.querySelector<HTMLElement>("[data-vitrine-track]");
  const sticky = root.querySelector<HTMLElement>("[data-vitrine-sticky]");
  const prev = root.querySelector<HTMLButtonElement>("[data-vitrine-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-vitrine-next]");
  const hint = root.querySelector<HTMLElement>("[data-vitrine-instruction]");
  const current = root.querySelector<HTMLElement>("[data-vitrine-current]");
  if (!track || !sticky || !prev || !next) return;

  root.dataset.vitrineReady = "true";
  const items = Array.from(track.children) as HTMLElement[];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse), (hover: none)");
  const desktop = window.matchMedia("(min-width: 1100px)");
  const tablet = window.matchMedia("(min-width: 700px) and (max-width: 1099px)");
  let mode: VitrineMode = "native";
  let currentIndex = 0;
  let trigger: ScrollTrigger | undefined;
  let trackTween: gsap.core.Tween | undefined;
  let scrollFrame = 0;
  let resizeTimer = 0;
  let pointerId = -1;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragging = false;
  let suppressClick = false;

  const maxScroll = () => Math.max(0, track.scrollWidth - sticky.clientWidth);
  const itemLeft = (item: HTMLElement) =>
    Math.min(Math.max(0, item.offsetLeft - track.offsetLeft), maxScroll());

  const setControls = () => {
    prev.disabled = currentIndex <= 0;
    next.disabled = currentIndex >= items.length - 1;
    prev.setAttribute("aria-disabled", String(prev.disabled));
    next.setAttribute("aria-disabled", String(next.disabled));
    if (current) current.textContent = String(currentIndex + 1).padStart(2, "0");
  };

  const closestIndex = (left: number) => {
    let index = 0;
    let distance = Number.POSITIVE_INFINITY;
    items.forEach((item, itemIndex) => {
      const delta = Math.abs(itemLeft(item) - left);
      if (delta < distance) {
        distance = delta;
        index = itemIndex;
      }
    });
    return index;
  };

  const syncNativeIndex = () => {
    currentIndex = closestIndex(track.scrollLeft);
    setControls();
  };

  const goToIndex = (requested: number) => {
    currentIndex = Math.max(0, Math.min(items.length - 1, requested));
    const target = items[currentIndex];
    if (!target) return;
    setControls();

    if (mode !== "desktop") {
      track.scrollTo({
        left: itemLeft(target),
        behavior: reduced.matches ? "auto" : "smooth",
      });
      return;
    }

    const distance = maxScroll();
    if (!trigger || distance === 0) return;
    const progress = itemLeft(target) / distance;
    window.scrollTo({
      top: trigger.start + progress * (trigger.end - trigger.start),
      behavior: reduced.matches ? "auto" : "smooth",
    });
  };

  const onPrevious = () => goToIndex(currentIndex - 1);
  const onNext = () => goToIndex(currentIndex + 1);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    goToIndex(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  };
  const onFocusIn = (event: FocusEvent) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>(".projetos__item");
    const index = item ? items.indexOf(item) : -1;
    if (index >= 0) goToIndex(index);
  };
  const onNativeScroll = () => {
    if (mode === "desktop" || scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      syncNativeIndex();
    });
  };

  const resetDrag = () => {
    if (pointerId >= 0 && track.hasPointerCapture(pointerId)) {
      track.releasePointerCapture(pointerId);
    }
    pointerId = -1;
    dragging = false;
    delete track.dataset.dragging;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (mode === "desktop" || event.pointerType !== "mouse" || event.button !== 0) return;
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;
    dragging = false;
    suppressClick = false;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const delta = event.clientX - dragStartX;
    if (!dragging && Math.abs(delta) < DRAG_THRESHOLD) return;
    if (!dragging) {
      dragging = true;
      track.dataset.dragging = "true";
      track.setPointerCapture(event.pointerId);
    }
    track.scrollLeft = dragStartScroll - delta;
    event.preventDefault();
  };

  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    suppressClick = dragging;
    resetDrag();
    syncNativeIndex();
    if (suppressClick) goToIndex(currentIndex);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    suppressClick = false;
    resetDrag();
    syncNativeIndex();
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  };

  const destroyTrigger = () => {
    trigger?.kill();
    trackTween?.kill();
    trigger = undefined;
    trackTween = undefined;
    gsap.set(track, { clearProps: "transform,willChange" });
  };

  const setupDesktop = () => {
    destroyTrigger();
    if (maxScroll() <= 0) return;

    const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    gsap.set(track, { x: 0, willChange: "transform" });
    trackTween = gsap.to(track, {
      x: () => -maxScroll(),
      ease: "none",
      paused: true,
    });
    trigger = ScrollTrigger.create({
      trigger: root,
      start: `top top+=${headerHeight}`,
      end: () => `+=${Math.max(maxScroll(), 1)}`,
      pin: sticky,
      scrub: 0.45,
      animation: trackTween,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        currentIndex = closestIndex(maxScroll() * self.progress);
        setControls();
      },
    });
  };

  const updateInputHint = () => {
    root.dataset.vitrineInput = coarse.matches ? "touch" : "pointer";
    if (!hint) return;
    if (mode === "desktop") {
      hint.textContent = "Role ou use as setas para explorar";
    } else {
      hint.textContent = coarse.matches
        ? "Deslize para explorar"
        : "Arraste ou use as setas";
    }
  };

  const applyMode = () => {
    destroyTrigger();
    resetDrag();
    suppressClick = false;

    if (desktop.matches && !reduced.matches && !coarse.matches) {
      mode = "desktop";
      root.dataset.vitrineMode = mode;
      track.scrollLeft = 0;
      setupDesktop();
    } else {
      mode = tablet.matches && !reduced.matches ? "tablet" : "native";
      root.dataset.vitrineMode = mode;
      const target = items[currentIndex];
      track.scrollLeft = target ? itemLeft(target) : 0;
    }

    updateInputHint();
    setControls();
  };

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      applyMode();
      ScrollTrigger.refresh();
    }, 180);
  };

  prev.addEventListener("click", onPrevious);
  next.addEventListener("click", onNext);
  root.addEventListener("keydown", onKeyDown);
  track.addEventListener("focusin", onFocusIn);
  track.addEventListener("scroll", onNativeScroll, { passive: true });
  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove);
  track.addEventListener("pointerup", onPointerEnd);
  track.addEventListener("pointercancel", onPointerCancel);
  track.addEventListener("click", onClickCapture, true);
  window.addEventListener("resize", onResize, { passive: true });
  reduced.addEventListener("change", applyMode);
  coarse.addEventListener("change", applyMode);
  desktop.addEventListener("change", applyMode);
  tablet.addEventListener("change", applyMode);

  const observer = new ResizeObserver(onResize);
  observer.observe(track);
  observer.observe(sticky);
  applyMode();

  return () => {
    destroyTrigger();
    observer.disconnect();
    resetDrag();
    prev.removeEventListener("click", onPrevious);
    next.removeEventListener("click", onNext);
    root.removeEventListener("keydown", onKeyDown);
    track.removeEventListener("focusin", onFocusIn);
    track.removeEventListener("scroll", onNativeScroll);
    track.removeEventListener("pointerdown", onPointerDown);
    track.removeEventListener("pointermove", onPointerMove);
    track.removeEventListener("pointerup", onPointerEnd);
    track.removeEventListener("pointercancel", onPointerCancel);
    track.removeEventListener("click", onClickCapture, true);
    window.removeEventListener("resize", onResize);
    reduced.removeEventListener("change", applyMode);
    coarse.removeEventListener("change", applyMode);
    desktop.removeEventListener("change", applyMode);
    tablet.removeEventListener("change", applyMode);
    window.clearTimeout(resizeTimer);
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    delete root.dataset.vitrineReady;
    delete root.dataset.vitrineMode;
    delete root.dataset.vitrineInput;
  };
}
