/** Obsidian-only controls. Kept separate from the renderer shared with websites. */
export function openLightbox(images: HTMLImageElement[], initial: number, icon: (el: HTMLElement, name: string) => void): () => void {
  const doc = images[initial].ownerDocument;
  const previous = doc.activeElement as HTMLElement | null;
  const overlay = doc.createElement("div");
  overlay.className = "igc-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "画像の拡大表示");
  overlay.tabIndex = -1;
  const title = overlay.appendChild(doc.createElement("div"));
  title.className = "igc-lightbox__title";
  const stage = overlay.appendChild(doc.createElement("div"));
  stage.className = "igc-lightbox__stage";
  const image = stage.appendChild(doc.createElement("img"));
  image.draggable = false;
  let index = initial, zoom = 1, x = 0, y = 0;
  let drag: { id: number; x: number; y: number } | null = null;
  let moved = false, closed = false;
  const update = () => { image.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`; overlay.classList.toggle("is-zoomed", zoom > 1); };
  const show = (next: number) => {
    index = (next + images.length) % images.length;
    image.src = images[index].src;
    image.alt = images[index].alt;
    title.textContent = images[index].dataset.imagePath?.split("/").pop() || image.alt;
    zoom = 1; x = y = 0; update();
  };
  let animation: Animation | undefined;
  const close = () => { if (closed) return; closed = true; animation?.cancel(); overlay.remove(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  const button = (name: string, label: string, cls: string, action: () => void) => {
    const el = overlay.appendChild(doc.createElement("button"));
    el.className = `clickable-icon ${cls}`; el.type = "button"; el.ariaLabel = label; el.title = label;
    icon(el, name); el.addEventListener("click", action); return el;
  };
  button("x", "閉じる", "igc-lightbox__close", close);
  if (images.length > 1) {
    button("chevron-left", "前の画像", "igc-lightbox__prev", () => show(index - 1));
    button("chevron-right", "次の画像", "igc-lightbox__next", () => show(index + 1));
  }
  const changeZoom = (value: number) => { animation?.cancel(); zoom = Math.min(10, Math.max(1, value)); if (zoom === 1) x = y = 0; update(); };
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else if (event.key === "+" || event.key === "=") changeZoom(zoom * 1.2);
    else if (event.key === "-") changeZoom(zoom / 1.2);
    else if (event.key === "Tab") {
      const buttons = Array.from(overlay.querySelectorAll("button"));
      const current = buttons.indexOf(doc.activeElement as HTMLButtonElement);
      buttons[(current + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus();
    } else return;
    event.preventDefault(); event.stopPropagation();
  });
  stage.addEventListener("wheel", event => { event.preventDefault(); changeZoom(zoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2)); }, { passive: false });
  stage.addEventListener("pointerdown", event => { if (event.target === stage) moved = false; });
  stage.addEventListener("click", event => { if (event.target === stage && !moved) close(); });
  image.addEventListener("dblclick", () => changeZoom(zoom > 1 ? 1 : 2));
  image.addEventListener("pointerdown", event => {
    if (zoom <= 1 || event.button !== 0) return;
    event.preventDefault(); moved = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }; image.setPointerCapture(event.pointerId);
  });
  image.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    x += event.clientX - drag.x; y += event.clientY - drag.y;
    drag.x = event.clientX; drag.y = event.clientY; moved = true; update();
  });
  const endDrag = () => { drag = null; };
  image.addEventListener("pointerup", endDrag); image.addEventListener("pointercancel", endDrag);
  image.addEventListener("lostpointercapture", endDrag);
  show(initial); doc.body.append(overlay); overlay.focus();
  const animateOpen = () => {
    if (closed || index !== initial || zoom !== 1 || doc.defaultView!.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const from = images[initial].getBoundingClientRect(), to = image.getBoundingClientRect();
    if (!from.width || !to.width) return;
    animation = image.animate([
      { transform: `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) scale(${from.width / to.width})` },
      { transform: "translate(0, 0) scale(1)" }
    ], { duration: 180, easing: "ease-out" });
  };
  if (image.complete) animateOpen(); else image.addEventListener("load", animateOpen, { once: true });
  return close;
}

export function attachControls(row: HTMLElement, icon: (el: HTMLElement, name: string) => void, edit: (index: number) => void): () => void {
  const images = Array.from(row.querySelectorAll<HTMLImageElement>(".image-grid-captions__image"));
  const bars: HTMLElement[] = [];
  let close: (() => void) | undefined;
  images.forEach((image, index) => {
    const bar = row.ownerDocument.createElement("div");
    bar.className = "igc-image-actions";
    for (const [name, label, action] of [
      ["zoom-in", "拡大表示", () => { close?.(); close = openLightbox(images, index, icon); }],
      ["code-2", "画像の記述を編集", () => edit(index)]
    ] as const) {
      const button = bar.appendChild(row.ownerDocument.createElement("button"));
      button.type = "button"; button.className = "clickable-icon"; button.ariaLabel = label; button.title = label;
      icon(button, name);
      button.addEventListener("mousedown", event => event.preventDefault());
      button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); action(); });
    }
    image.parentElement!.append(bar); bars.push(bar);
  });
  const block = row.closest(".cm-embed-block");
  block?.classList.add("igc-has-controls");
  return () => { close?.(); bars.forEach(bar => bar.remove()); block?.classList.remove("igc-has-controls"); };
}
