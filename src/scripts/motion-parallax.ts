import { gsap } from "gsap";

const clampDepth = (value: number) => Math.max(0, Math.min(15, value));
const numberFrom = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function initMotion(root: ParentNode = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse), (hover: none)");
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-motion-depth]"),
  );

  if (reduced.matches || coarse.matches || targets.length === 0) {
    return () => undefined;
  }

  const movers = targets.map((element) => {
    const requestedDepth = clampDepth(
      numberFrom(element.dataset.motionDepth, 0),
    );
    const vectorX = numberFrom(element.dataset.motionX, 1);
    const vectorY = numberFrom(element.dataset.motionY, 1);
    const requestedX = requestedDepth * vectorX;
    const requestedY = requestedDepth * vectorY;

    const parentMover = element.parentElement?.closest<HTMLElement>(
      "[data-motion-depth]",
    );
    const parentDepth = clampDepth(
      numberFrom(parentMover?.dataset.motionDepth, 0),
    );
    const parentX =
      parentDepth * numberFrom(parentMover?.dataset.motionX, 1);
    const parentY =
      parentDepth * numberFrom(parentMover?.dataset.motionY, 1);
    const rotate = Math.max(
      -1,
      Math.min(1, numberFrom(element.dataset.motionRotate, 0)),
    );

    // Camadas aninhadas recebem apenas o delta necessário para alcançar a
    // posição absoluta pedida. Assim, capa 15 dentro de volume 9 continua 15.
    const xDepth = requestedX - parentX;
    const yDepth = requestedY - parentY;
    const response = Math.max(0.25, 0.62 - requestedDepth * 0.021);

    if (rotate !== 0) {
      gsap.set(element, {
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      });
    }

    return {
      element,
      xDepth,
      yDepth,
      rotate,
      x: gsap.quickTo(element, "x", {
        duration: response,
        ease: "power3.out",
      }),
      y: gsap.quickTo(element, "y", {
        duration: response,
        ease: "power3.out",
      }),
      rotationX: gsap.quickTo(element, "rotationX", {
        duration: response + 0.04,
        ease: "power3.out",
      }),
      rotationY: gsap.quickTo(element, "rotationY", {
        duration: response + 0.04,
        ease: "power3.out",
      }),
    };
  });

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const render = () => {
    frame = 0;
    for (const mover of movers) {
      mover.x(pointerX * mover.xDepth);
      mover.y(pointerY * mover.yDepth);
      mover.rotationX(-pointerY * mover.rotate);
      mover.rotationY(pointerX * mover.rotate);
    }
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(render);
  };
  const onPointerMove = (event: PointerEvent) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    schedule();
  };
  const returnToRest = () => {
    pointerX = 0;
    pointerY = 0;
    schedule();
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", returnToRest);
  document.documentElement.addEventListener("pointerleave", returnToRest);

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("blur", returnToRest);
    document.documentElement.removeEventListener("pointerleave", returnToRest);
    if (frame) window.cancelAnimationFrame(frame);
    for (const { element } of movers) gsap.killTweensOf(element);
    gsap.set(targets, {
      clearProps:
        "x,y,rotationX,rotationY,transformPerspective,transformStyle,willChange",
    });
  };
}
