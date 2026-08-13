export function initCursor(root: ParentNode = document) {
  const cursor = root.querySelector<HTMLElement>("[data-site-cursor]");
  if (!cursor) return () => undefined;

  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const documentRoot = document.documentElement;
  let active = false;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let inside = false;

  const hide = () => {
    inside = false;
    cursor.dataset.cursorVisible = "false";
  };

  const render = () => {
    frame = 0;
    if (!active) return;
    cursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    cursor.dataset.cursorVisible = String(inside);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!active) return;
    inside = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  const onPointerEnter = (event: PointerEvent) => {
    if (!active) return;
    inside = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  const refreshPosition = () => {
    if (active && inside && !frame) frame = window.requestAnimationFrame(render);
  };

  const activate = () => {
    active = finePointer.matches;
    documentRoot.dataset.customCursor = String(active);
    if (!active) {
      hide();
      cursor.removeAttribute("style");
    }
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", refreshPosition, { passive: true });
  window.addEventListener("blur", hide);
  documentRoot.addEventListener("pointerleave", hide);
  documentRoot.addEventListener("pointerenter", onPointerEnter);
  finePointer.addEventListener("change", activate);
  activate();

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("scroll", refreshPosition);
    window.removeEventListener("blur", hide);
    documentRoot.removeEventListener("pointerleave", hide);
    documentRoot.removeEventListener("pointerenter", onPointerEnter);
    finePointer.removeEventListener("change", activate);
    if (frame) window.cancelAnimationFrame(frame);
    delete documentRoot.dataset.customCursor;
    delete cursor.dataset.cursorVisible;
    cursor.removeAttribute("style");
  };
}
