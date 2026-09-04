import { nanoid } from "nanoid";
import type {
  Canvas,
  FabricImage,
  FabricObject,
  TPointerEventInfo,
} from "fabric";
import { calculateDpi, dpiStatus } from "@/lib/dpi";
import { inchesToPx } from "@/lib/units";
import { useCanvasStore } from "@/features/editor/stores/canvas-store";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { useHistoryStore } from "@/features/editor/stores/history-store";
import type { DesignDocument, DesignPage } from "@/types/design";
import type { PreflightIssue } from "@/types/preflight";
import type { ProductConfiguration } from "@/types/product";

const EXTRA = ["id", "name", "locked", "role", "originalWidth", "originalHeight"];
const PLACE = { originX: "left" as const, originY: "top" as const };

type FabricMod = typeof import("fabric");

export class EditorEngine {
  canvas: Canvas;
  private fabric: FabricMod;
  private skipHistory = false;
  private historyTimer: ReturnType<typeof setTimeout> | null = null;
  private panning = false;
  private lastX = 0;
  private lastY = 0;
  private pageWidth = 800;
  private pageHeight = 500;
  private bleed = 0.125;
  private safe = 0.125;
  private disposing = false;
  private viewportEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  contextMenuHandler: ((info: { x: number; y: number; locked: boolean }) => void) | null = null;
  private clipJson: Record<string, unknown> | null = null;

  constructor(fabric: FabricMod, el: HTMLCanvasElement, width: number, height: number) {
    this.fabric = fabric;
    fabric.FabricObject.customProperties = EXTRA;
    const defaults = fabric.FabricObject.ownDefaults as { originX?: string; originY?: string };
    defaults.originX = "left";
    defaults.originY = "top";
    this.canvas = new fabric.Canvas(el, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: "transparent",
      width,
      height,
    });
    this.pageWidth = width;
    this.pageHeight = height;
    this.bindEvents();
    this.canvas.calcOffset();
  }

  bindViewport(el: HTMLElement) {
    this.viewportEl = el;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect;
      if (!size || size.width < 80 || size.height < 80) return;
      this.resizeWorkspace(size.width, size.height);
    });
    this.resizeObserver.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.width >= 80 && rect.height >= 80) {
      this.resizeWorkspace(rect.width, rect.height);
    }
  }

  resizeWorkspace(width: number, height: number) {
    this.canvas.setDimensions({
      width: Math.round(width),
      height: Math.round(height),
    });
    this.fitToScreen();
    this.canvas.calcOffset();
  }

  setPrintGuides(config: ProductConfiguration) {
    this.bleed = config.bleed;
    this.safe = config.safeArea;
    this.pageWidth = inchesToPx(config.width);
    this.pageHeight = inchesToPx(config.height);
    this.redrawPageBoard();
    this.redrawGuides();
    this.fitToScreen();
  }

  private bindEvents() {
    const canvas = this.canvas;
    canvas.on("selection:created", () => this.syncSelection());
    canvas.on("selection:updated", () => this.syncSelection());
    canvas.on("selection:cleared", () => useEditorStore.getState().setSelection(null, null));
    canvas.on("object:added", (evt) => {
      const target = (evt as { target?: FabricObject }).target;
      if (this.isMeta(target)) return;
      this.afterMutation();
    });
    canvas.on("object:removed", (evt) => {
      const target = (evt as { target?: FabricObject }).target;
      if (this.isMeta(target)) return;
      this.afterMutation();
    });
    canvas.on("object:modified", () => this.afterMutation());
    canvas.on("mouse:down", (opt) => this.onPointerDown(opt));
    canvas.on("mouse:move", (opt) => this.onPointerMove(opt));
    canvas.on("mouse:up", () => {
      this.panning = false;
      this.canvas.setCursor(useCanvasStore.getState().mode === "pan" ? "grab" : "default");
    });
    canvas.on("contextmenu", (opt) => this.onContextMenu(opt));
    canvas.on("mouse:wheel", (opt) => {
      const e = opt.e as WheelEvent;
      if (e.cancelable) e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      this.setZoom(useCanvasStore.getState().zoom + delta);
    });
  }

  onContextMenu(opt: { e: Event; target?: FabricObject }) {
    const event = opt.e as MouseEvent;
    if (event.cancelable) event.preventDefault();
    let target = opt.target && !this.isMeta(opt.target) ? opt.target : undefined;
    if (!target) {
      const pointer = this.canvas.getScenePoint(event);
      const hit = this.canvas.searchPossibleTargets(this.canvas.getObjects(), pointer).target;
      if (hit && !this.isMeta(hit)) target = hit;
    }
    if (!target) {
      const active = this.canvas.getActiveObject();
      if (active && !this.isMeta(active)) target = active;
    }
    if (!target) return;
    this.canvas.setActiveObject(target);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.contextMenuHandler?.({
      x: event.clientX,
      y: event.clientY,
      locked: Boolean((target as { locked?: boolean }).locked),
    });
  }

  private onPointerDown(opt: TPointerEventInfo) {
    const e = opt.e as MouseEvent;
    if (e.button === 2) return;
    if (useCanvasStore.getState().mode !== "pan") return;
    this.panning = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.canvas.setCursor("grabbing");
  }

  private onPointerMove(opt: TPointerEventInfo) {
    if (!this.panning) return;
    const e = opt.e as MouseEvent;
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;
    vpt[4] += e.clientX - this.lastX;
    vpt[5] += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.canvas.requestRenderAll();
  }

  setMode(mode: "select" | "pan") {
    useCanvasStore.getState().setMode(mode);
    this.canvas.selection = mode === "select";
    this.canvas.skipTargetFind = mode === "pan";
    this.canvas.defaultCursor = mode === "pan" ? "grab" : "default";
    this.canvas.requestRenderAll();
  }

  setZoom(next: number) {
    const zoom = Math.min(4, Math.max(0.35, next));
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(center, zoom);
    useCanvasStore.getState().setZoom(zoom);
  }

  fitToScreen() {
    const parent = this.viewportEl ?? (this.canvas.wrapperEl?.closest("[data-canvas-viewport]") as HTMLElement | null);
    const viewW = parent?.clientWidth || this.canvas.getWidth() || 800;
    const viewH = parent?.clientHeight || this.canvas.getHeight() || 600;
    if (viewW < 80 || viewH < 80) return;
    const pad = 48;
    const scale = Math.min((viewW - pad) / this.pageWidth, (viewH - pad) / this.pageHeight);
    const zoom = Math.min(Math.max(scale, 0.35), 3);
    const panX = (viewW - this.pageWidth * zoom) / 2;
    const panY = (viewH - this.pageHeight * zoom) / 2;
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    useCanvasStore.getState().setZoom(zoom);
    this.canvas.requestRenderAll();
    this.canvas.calcOffset();
  }

  resetView() {
    this.fitToScreen();
  }

  private afterMutation() {
    if (this.skipHistory || this.disposing) return;
    useCanvasStore.getState().bumpLayers();
    useEditorStore.getState().setDirty(true);
    this.captureHistory();
  }

  private flushHistoryTimer() {
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
  }

  scheduleHistory() {
    if (this.skipHistory || this.disposing) return;
    useHistoryStore.getState().markPending();
    this.flushHistoryTimer();
    this.historyTimer = setTimeout(() => {
      this.historyTimer = null;
      this.captureHistory();
    }, 280);
  }

  captureHistory() {
    if (this.skipHistory || this.disposing) return;
    this.flushHistoryTimer();
    useHistoryStore.getState().push(JSON.stringify(this.serialize()));
  }

  async undo() {
    const current = JSON.stringify(this.serialize());
    const last = useHistoryStore.getState().past.at(-1);
    this.flushHistoryTimer();
    if (last && last !== current) {
      await this.restoreSnapshot(last);
      return;
    }
    const snapshot = useHistoryStore.getState().undo();
    if (!snapshot || snapshot === current) return;
    await this.restoreSnapshot(snapshot);
  }

  async redo() {
    this.flushHistoryTimer();
    const current = JSON.stringify(this.serialize());
    const snapshot = useHistoryStore.getState().redo(current);
    if (!snapshot) return;
    await this.restoreSnapshot(snapshot);
  }

  private async restoreSnapshot(snapshot: string) {
    await this.loadJson(JSON.parse(snapshot) as Record<string, unknown>, false);
  }

  serialize() {
    const json = this.canvas.toJSON() as Record<string, unknown> & { objects?: Array<Record<string, unknown>> };
    json.objects = (json.objects ?? []).filter((obj) => obj.role !== "guide");
    delete json.width;
    delete json.height;
    delete json.viewportTransform;
    return json;
  }

  async loadJson(json: Record<string, unknown>, history = true) {
    this.skipHistory = true;
    this.flushHistoryTimer();
    const vpt = this.canvas.viewportTransform?.slice() as number[] | undefined;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    try {
      const payload = { ...json } as Record<string, unknown>;
      delete payload.width;
      delete payload.height;
      delete payload.viewportTransform;
      await this.canvas.loadFromJSON(payload);
      this.canvas.setDimensions({ width, height });
      if (vpt) this.canvas.setViewportTransform(vpt as [number, number, number, number, number, number]);
      const hasPage = this.canvas.getObjects().some((obj) => (obj as { role?: string }).role === "page");
      if (!hasPage) this.redrawPageBoard();
      else this.sendPageToBack();
      this.redrawGuides();
      this.canvas.requestRenderAll();
      this.syncSelection();
      useCanvasStore.getState().bumpLayers();
    } finally {
      this.skipHistory = false;
    }
    if (history) this.captureHistory();
  }

  private tag(obj: FabricObject, name: string, extras?: Record<string, unknown>) {
    obj.set({
      id: nanoid(),
      name,
      role: "content",
      ...extras,
    });
    return obj;
  }

  addHeading() {
    this.addText("Your heading", 36, "700");
  }
  addSubheading() {
    this.addText("Your subheading", 22, "600");
  }
  addBody() {
    this.addText("Add your body copy here. Keep important text inside the safe area.", 16, "400");
  }

  addText(text: string, fontSize = 24, fontWeight = "400") {
    const box = new this.fabric.Textbox(text, {
      ...PLACE,
      left: this.pageWidth * 0.12,
      top: this.pageHeight * 0.18,
      width: this.pageWidth * 0.76,
      fontSize,
      fontFamily: "Inter, Geist, Arial, sans-serif",
      fontWeight,
      fill: "#111827",
      editable: true,
    });
    this.tag(box, text.slice(0, 24) || "Text");
    this.canvas.add(box);
    this.canvas.setActiveObject(box);
    this.canvas.requestRenderAll();
  }

  async addImageFromUrl(url: string, name = "Image", originalWidth?: number, originalHeight?: number) {
    const remote = url.startsWith("http://") || url.startsWith("https://");
    const img = await this.fabric.FabricImage.fromURL(url, remote ? { crossOrigin: "anonymous" } : {});
    this.fitImage(img);
    this.tag(img, name, {
      originalWidth: originalWidth ?? img.width,
      originalHeight: originalHeight ?? img.height,
    });
    this.canvas.add(img);
    this.canvas.setActiveObject(img);
    this.canvas.requestRenderAll();
    return img;
  }

  private fitImage(img: FabricImage) {
    const maxW = this.pageWidth * 0.7;
    const maxH = this.pageHeight * 0.7;
    const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
    img.scale(scale);
    img.set({ left: (this.pageWidth - (img.getScaledWidth() ?? 0)) / 2, top: (this.pageHeight - (img.getScaledHeight() ?? 0)) / 2 });
  }

  addRect(rx = 0) {
    const rect = new this.fabric.Rect({
      ...PLACE,
      left: this.pageWidth * 0.25,
      top: this.pageHeight * 0.25,
      width: this.pageWidth * 0.4,
      height: this.pageHeight * 0.28,
      fill: "#2563eb",
      rx,
      ry: rx,
    });
    this.tag(rect, rx ? "Rounded rectangle" : "Rectangle");
    this.canvas.add(rect);
    this.canvas.setActiveObject(rect);
    this.canvas.requestRenderAll();
  }

  addCircle() {
    const circle = new this.fabric.Circle({
      ...PLACE,
      left: this.pageWidth * 0.35,
      top: this.pageHeight * 0.25,
      radius: Math.min(this.pageWidth, this.pageHeight) * 0.16,
      fill: "#0ea5e9",
    });
    this.tag(circle, "Circle");
    this.canvas.add(circle);
    this.canvas.setActiveObject(circle);
    this.canvas.requestRenderAll();
  }

  addTriangle() {
    const triangle = new this.fabric.Triangle({
      ...PLACE,
      left: this.pageWidth * 0.32,
      top: this.pageHeight * 0.22,
      width: this.pageWidth * 0.28,
      height: this.pageHeight * 0.32,
      fill: "#f97316",
    });
    this.tag(triangle, "Triangle");
    this.canvas.add(triangle);
    this.canvas.setActiveObject(triangle);
    this.canvas.requestRenderAll();
  }

  addLine() {
    const line = new this.fabric.Line(
      [this.pageWidth * 0.15, this.pageHeight * 0.5, this.pageWidth * 0.85, this.pageHeight * 0.5],
      { ...PLACE, stroke: "#111827", strokeWidth: 4 },
    );
    this.tag(line, "Line");
    this.canvas.add(line);
    this.canvas.setActiveObject(line);
    this.canvas.requestRenderAll();
  }

  addStar() {
    const cx = 0;
    const cy = 0;
    const spikes = 5;
    const outer = Math.min(this.pageWidth, this.pageHeight) * 0.16;
    const inner = outer * 0.45;
    const pts: { x: number; y: number }[] = [];
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    for (let i = 0; i < spikes; i++) {
      pts.push({ x: cx + Math.cos(rot) * outer, y: cy + Math.sin(rot) * outer });
      rot += step;
      pts.push({ x: cx + Math.cos(rot) * inner, y: cy + Math.sin(rot) * inner });
      rot += step;
    }
    const star = new this.fabric.Polygon(pts, {
      ...PLACE,
      left: this.pageWidth * 0.38,
      top: this.pageHeight * 0.22,
      fill: "#eab308",
    });
    this.tag(star, "Star");
    this.canvas.add(star);
    this.canvas.setActiveObject(star);
    this.canvas.requestRenderAll();
  }

  addArrow() {
    const path = new this.fabric.Path("M 0 20 L 80 20 L 80 8 L 120 28 L 80 48 L 80 36 L 0 36 Z", {
      ...PLACE,
      left: this.pageWidth * 0.28,
      top: this.pageHeight * 0.4,
      fill: "#111827",
    });
    this.tag(path, "Arrow");
    this.canvas.add(path);
    this.canvas.setActiveObject(path);
    this.canvas.requestRenderAll();
  }

  addPresetShape(kind: import("@/features/editor/shapes/catalog").ShapeKind) {
    const fill = "#7a7a7a";
    const left = this.pageWidth * 0.28;
    const top = this.pageHeight * 0.22;
    const size = Math.min(this.pageWidth, this.pageHeight) * 0.36;
    let obj: FabricObject;
    if (kind === "line") {
      obj = new this.fabric.Line([left, this.pageHeight * 0.5, left + size * 1.4, this.pageHeight * 0.5], {
        ...PLACE,
        stroke: fill,
        strokeWidth: 8,
      });
    } else if (kind === "square") {
      obj = new this.fabric.Rect({ ...PLACE, left, top, width: size, height: size, fill });
    } else if (kind === "rectangle") {
      obj = new this.fabric.Rect({ ...PLACE, left, top: top + size * 0.15, width: size * 1.4, height: size * 0.55, fill });
    } else if (kind === "circle") {
      obj = new this.fabric.Circle({ ...PLACE, left, top, radius: size / 2, fill });
    } else if (kind === "triangle") {
      obj = new this.fabric.Triangle({ ...PLACE, left, top, width: size, height: size, fill });
    } else if (kind === "diamond") {
      obj = new this.fabric.Polygon(
        [
          { x: size / 2, y: 0 },
          { x: size, y: size / 2 },
          { x: size / 2, y: size },
          { x: 0, y: size / 2 },
        ],
        { ...PLACE, left, top, fill },
      );
    } else if (kind === "pentagon") {
      obj = new this.fabric.Polygon(regularPolygon(5, size / 2), { ...PLACE, left, top, fill });
    } else if (kind === "star") {
      obj = new this.fabric.Polygon(starPoints(5, size / 2, size / 4.4), { ...PLACE, left, top, fill });
    } else if (kind === "burst") {
      obj = new this.fabric.Polygon(starPoints(12, size / 2, size / 3.4), { ...PLACE, left, top, fill });
    } else if (kind === "arrow") {
      obj = new this.fabric.Path("M 0 18 L 46 18 L 46 6 L 72 28 L 46 50 L 46 38 L 0 38 Z", {
        ...PLACE,
        left,
        top: top + 8,
        fill,
        scaleX: size / 72,
        scaleY: size / 72,
      });
    } else if (kind === "heart") {
      obj = new this.fabric.Path(
        "M24 42s-16-10-16-21A9 9 0 0 1 24 12a9 9 0 0 1 16 9c0 11-16 21-16 21z",
        { ...PLACE, left, top, fill, scaleX: size / 40, scaleY: size / 40 },
      );
    } else if (kind === "check") {
      obj = new this.fabric.Path("M8 26 L20 38 L44 10", {
        ...PLACE,
        left,
        top,
        fill: "",
        stroke: fill,
        strokeWidth: 6,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        scaleX: size / 52,
        scaleY: size / 52,
      });
    } else if (kind === "cloud" || kind === "cloud-outline") {
      obj = new this.fabric.Path("M18 40h28a12 12 0 0 0 1.2-24 16 16 0 0 0-30-2.5A11 11 0 0 0 18 40z", {
        ...PLACE,
        left,
        top,
        fill: kind === "cloud" ? fill : "",
        stroke: fill,
        strokeWidth: kind === "cloud-outline" ? 3 : 0,
        scaleX: size / 64,
        scaleY: size / 64,
      });
    } else {
      obj = new this.fabric.Rect({ ...PLACE, left, top, width: size, height: size, fill });
    }
    this.tag(obj, kind);
    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
  }

  addIcon(kind: "check" | "heart" | "pin") {
    if (kind === "pin") {
      this.addPresetShape("burst");
      return;
    }
    this.addPresetShape(kind);
  }

  setBackgroundColor(color: string) {
    const board = this.canvas.getObjects().find((obj) => (obj as { role?: string }).role === "page");
    if (board) {
      board.set({ fill: color });
    } else {
      this.canvas.backgroundColor = color;
    }
    this.canvas.requestRenderAll();
    this.scheduleHistory();
    useEditorStore.getState().setDirty(true);
  }

  async setPagePattern(kind: import("@/features/editor/shapes/catalog").ShapeKind, tile = 48) {
    const source = document.createElement("canvas");
    const gap = Math.max(8, Math.round(tile * 0.35));
    source.width = tile + gap;
    source.height = tile + gap;
    const ctx = source.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#7a7a7a";
    ctx.strokeStyle = "#7a7a7a";
    ctx.lineWidth = 3;
    const cx = source.width / 2;
    const cy = source.height / 2;
    const r = tile / 3.2;
    if (kind === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "square") {
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else if (kind === "line") {
      ctx.beginPath();
      ctx.moveTo(8, cy);
      ctx.lineTo(source.width - 8, cy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      for (let i = 1; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    const board = this.canvas.getObjects().find((obj) => (obj as { role?: string }).role === "page");
    if (!board) return;
    const pattern = new this.fabric.Pattern({ source, repeat: "repeat" });
    board.set({ fill: pattern });
    this.canvas.requestRenderAll();
    this.captureHistory();
    useEditorStore.getState().setDirty(true);
  }

  async setBackgroundImage(url: string) {
    const img = await this.fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    img.scaleToWidth(this.pageWidth);
    img.scaleToHeight(this.pageHeight);
    this.canvas.backgroundImage = img;
    this.canvas.requestRenderAll();
    this.captureHistory();
    useEditorStore.getState().setDirty(true);
  }

  clearBackground() {
    this.setBackgroundColor("#ffffff");
  }

  async addQr(dataUrl: string) {
    await this.addImageFromUrl(dataUrl, "QR code");
  }

  applyTemplate(presetId: string, palette: string[]) {
    this.skipHistory = true;
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as FabricObject & { role?: string }).role !== "guide") this.canvas.remove(obj);
    });
    const [a, b, c] = palette;
    this.canvas.backgroundColor = c ?? "#ffffff";
    const band = new this.fabric.Rect({
      ...PLACE,
      left: 0,
      top: 0,
      width: this.pageWidth,
      height: this.pageHeight * 0.38,
      fill: a,
    });
    this.tag(band, "Template band");
    const accent = new this.fabric.Rect({
      ...PLACE,
      left: 0,
      top: this.pageHeight * 0.38,
      width: this.pageWidth * 0.18,
      height: this.pageHeight * 0.62,
      fill: b,
    });
    this.tag(accent, "Accent");
    const title = new this.fabric.Textbox(presetLabel(presetId), {
      ...PLACE,
      left: this.pageWidth * 0.08,
      top: this.pageHeight * 0.1,
      width: this.pageWidth * 0.84,
      fill: "#ffffff",
      fontSize: Math.max(22, this.pageWidth * 0.06),
      fontWeight: "700",
      fontFamily: "Inter, Geist, Arial, sans-serif",
    });
    this.tag(title, "Heading");
    const body = new this.fabric.Textbox("Your name\nRole · Company\nhello@studio.com", {
      ...PLACE,
      left: this.pageWidth * 0.24,
      top: this.pageHeight * 0.52,
      width: this.pageWidth * 0.66,
      fill: "#111827",
      fontSize: Math.max(14, this.pageWidth * 0.035),
      fontFamily: "Inter, Geist, Arial, sans-serif",
    });
    this.tag(body, "Details");
    this.canvas.add(band);
    this.canvas.add(accent);
    this.canvas.add(title);
    this.canvas.add(body);
    this.bringGuidesToFront();
    this.sendPageToBack();
    this.skipHistory = false;
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(title);
    this.canvas.requestRenderAll();
    this.captureHistory();
    useCanvasStore.getState().bumpLayers();
    useEditorStore.getState().setDirty(true);
    useEditorStore.getState().setSelection(String((title as { id?: string }).id ?? ""), title.type ?? "textbox");
  }

  selected() {
    return this.canvas.getActiveObject() as (FabricObject & Record<string, unknown>) | undefined;
  }

  updateActive(props: Record<string, unknown>) {
    const obj = this.selected();
    if (!obj) return;
    obj.set(props);
    obj.setCoords();
    this.canvas.requestRenderAll();
    this.scheduleHistory();
    useEditorStore.getState().setDirty(true);
  }

  nudgeSelected(dx: number, dy: number) {
    const obj = this.selected();
    if (!obj || this.isMeta(obj)) return;
    if ((obj as { locked?: boolean }).locked) return;
    if (dx !== 0 && obj.lockMovementX) return;
    if (dy !== 0 && obj.lockMovementY) return;
    obj.set({
      left: (obj.left ?? 0) + dx,
      top: (obj.top ?? 0) + dy,
    });
    obj.setCoords();
    this.canvas.requestRenderAll();
    this.scheduleHistory();
    useEditorStore.getState().setDirty(true);
  }

  deleteSelected() {
    const obj = this.selected();
    if (!obj || this.isMeta(obj)) return;
    this.canvas.remove(obj);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  async duplicateSelected() {
    const obj = this.selected();
    if (!obj) return;
    const cloned = (await obj.clone()) as FabricObject;
    cloned.set({ ...PLACE, left: (obj.left ?? 0) + 16, top: (obj.top ?? 0) + 16 });
    this.tag(cloned, `${String((obj as { name?: string }).name ?? "Copy")} copy`);
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
  }

  lockSelected(locked: boolean) {
    const obj = this.selected();
    if (!obj) return;
    obj.set({
      locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
      hasControls: !locked,
    });
    this.canvas.requestRenderAll();
    this.captureHistory();
  }

  isSelectedLocked() {
    return Boolean((this.selected() as { locked?: boolean } | undefined)?.locked);
  }

  alignToPage(edge: "left" | "center" | "right" | "top" | "middle" | "bottom") {
    const obj = this.selected();
    if (!obj || this.isMeta(obj)) return;
    const width = obj.getScaledWidth();
    const height = obj.getScaledHeight();
    if (edge === "left") obj.set({ left: 0 });
    if (edge === "center") obj.set({ left: (this.pageWidth - width) / 2 });
    if (edge === "right") obj.set({ left: this.pageWidth - width });
    if (edge === "top") obj.set({ top: 0 });
    if (edge === "middle") obj.set({ top: (this.pageHeight - height) / 2 });
    if (edge === "bottom") obj.set({ top: this.pageHeight - height });
    obj.setCoords();
    this.canvas.requestRenderAll();
    this.captureHistory();
    useEditorStore.getState().setDirty(true);
  }

  bringToFront() {
    const obj = this.selected();
    if (!obj) return;
    this.canvas.bringObjectToFront(obj);
    this.bringGuidesToFront();
    this.afterMutation();
  }

  sendToBack() {
    const obj = this.selected();
    if (!obj) return;
    this.canvas.sendObjectToBack(obj);
    this.sendPageToBack();
    this.bringGuidesToFront();
    this.afterMutation();
  }

  copySelected() {
    const obj = this.selected();
    if (!obj || this.isMeta(obj)) return;
    this.clipJson = obj.toObject(EXTRA) as Record<string, unknown>;
  }

  async pasteClipboard() {
    if (!this.clipJson) return;
    const [cloned] = (await this.fabric.util.enlivenObjects([this.clipJson])) as FabricObject[];
    if (!cloned) return;
    cloned.set({
      ...PLACE,
      left: Number(cloned.left ?? 0) + 24,
      top: Number(cloned.top ?? 0) + 24,
    });
    this.tag(cloned, `${String((cloned as { name?: string }).name ?? "Object")} copy`);
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
  }

  moveForward() {
    const obj = this.selected();
    if (!obj) return;
    this.canvas.bringObjectForward(obj);
    this.bringGuidesToFront();
    this.afterMutation();
  }

  moveBackward() {
    const obj = this.selected();
    if (!obj) return;
    this.canvas.sendObjectBackwards(obj);
    this.afterMutation();
  }

  toggleVisibility(id: string) {
    const obj = this.byId(id);
    if (!obj) return;
    obj.visible = !obj.visible;
    this.canvas.requestRenderAll();
    useCanvasStore.getState().bumpLayers();
  }

  toggleLock(id: string) {
    const obj = this.byId(id);
    if (!obj) return;
    const locked = Boolean((obj as { locked?: boolean }).locked);
    obj.set({ locked: !locked, selectable: locked, evented: locked });
    this.canvas.requestRenderAll();
    useCanvasStore.getState().bumpLayers();
  }

  selectById(id: string) {
    const obj = this.byId(id);
    if (!obj) return;
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  rename(id: string, name: string) {
    const obj = this.byId(id);
    if (!obj) return;
    obj.set({ name });
    useCanvasStore.getState().bumpLayers();
  }

  reorder(idsFromTop: string[]) {
    const objects = this.contentObjects();
    const map = new Map(objects.map((obj) => [String((obj as { id?: string }).id), obj]));
    idsFromTop
      .slice()
      .reverse()
      .forEach((id, index) => {
        const obj = map.get(id);
        if (obj) this.canvas.moveObjectTo(obj, index);
      });
    this.bringGuidesToFront();
    this.canvas.requestRenderAll();
    this.captureHistory();
  }

  layers() {
    return this.contentObjects()
      .slice()
      .reverse()
      .map((obj) => ({
        id: String((obj as { id?: string }).id ?? ""),
        name: String((obj as { name?: string }).name ?? obj.type),
        type: obj.type ?? "object",
        visible: obj.visible !== false,
        locked: Boolean((obj as { locked?: boolean }).locked),
      }));
  }

  contentObjects() {
    return this.canvas.getObjects().filter((obj) => !this.isMeta(obj));
  }

  byId(id: string) {
    return this.canvas.getObjects().find((obj) => (obj as { id?: string }).id === id);
  }

  exportPng() {
    return this.capturePage(2);
  }

  thumbnail() {
    return this.capturePage(0.35);
  }

  private capturePage(multiplier: number) {
    const vpt = [...(this.canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0])] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const viewW = this.canvas.getWidth();
    const viewH = this.canvas.getHeight();
    this.setGuidesVisible(false);
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.canvas.setDimensions({ width: this.pageWidth, height: this.pageHeight });
    const data = this.canvas.toDataURL({ format: "png", multiplier });
    this.canvas.setDimensions({ width: viewW, height: viewH });
    this.canvas.setViewportTransform(vpt);
    this.setGuidesVisible(true);
    this.canvas.requestRenderAll();
    return data;
  }

  inspectPreflight(page: DesignPage): PreflightIssue[] {
    const issues: PreflightIssue[] = [];
    const safePx = inchesToPx(this.safe);
    for (const obj of this.contentObjects()) {
      const id = String((obj as { id?: string }).id ?? "");
      const bound = obj.getBoundingRect();
      if (bound.left < -8 || bound.top < -8 || bound.left + bound.width > this.pageWidth + 8 || bound.top + bound.height > this.pageHeight + 8) {
        issues.push({
          id: nanoid(),
          type: "warning",
          pageId: page.id,
          objectId: id,
          code: "outside-canvas",
          message: `${(obj as { name?: string }).name ?? "Object"} extends outside the canvas.`,
        });
      }
      if (obj.type?.includes("text")) {
        if (bound.left < safePx || bound.top < safePx || bound.left + bound.width > this.pageWidth - safePx) {
          issues.push({
            id: nanoid(),
            type: "warning",
            pageId: page.id,
            objectId: id,
            code: "text-safe-area",
            message: "Text sits outside the safe area.",
          });
        }
      }
      const origW = Number((obj as { originalWidth?: number }).originalWidth ?? 0);
      if (origW && obj.getScaledWidth) {
        const printed = (obj.getScaledWidth() as number) / 192;
        const dpi = calculateDpi(origW, printed);
        if (dpiStatus(dpi) === "warning" || dpiStatus(dpi) === "poor") {
          issues.push({
            id: nanoid(),
            type: dpiStatus(dpi) === "poor" ? "error" : "warning",
            pageId: page.id,
            objectId: id,
            code: "low-dpi",
            message: `Image prints at ${Math.round(dpi)} DPI. Enlarge less or use a higher-resolution file.`,
          });
        }
      }
    }
    return issues;
  }

  private syncSelection() {
    const obj = this.selected();
    useEditorStore.getState().setSelection(
      obj ? String(obj.id ?? "") : null,
      obj ? String(obj.type ?? "") : null,
    );
  }

  private isMeta(obj?: object | null) {
    const role = (obj as { role?: string } | undefined)?.role;
    return role === "guide" || role === "page";
  }

  private sendPageToBack() {
    const board = this.canvas.getObjects().find((obj) => (obj as { role?: string }).role === "page");
    if (board) this.canvas.sendObjectToBack(board);
  }

  private redrawPageBoard() {
    this.skipHistory = true;
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as { role?: string }).role === "page") this.canvas.remove(obj);
    });
    const board = new this.fabric.Rect({
      ...PLACE,
      left: 0,
      top: 0,
      width: this.pageWidth,
      height: this.pageHeight,
      fill: "#ffffff",
      selectable: false,
      evented: false,
      role: "page",
      name: "Page",
      id: "page-board",
      shadow: new this.fabric.Shadow({
        color: "rgba(15, 23, 42, 0.22)",
        blur: 32,
        offsetY: 12,
      }),
    });
    this.canvas.add(board);
    this.canvas.sendObjectToBack(board);
    this.skipHistory = false;
  }

  private redrawGuides() {
    this.skipHistory = true;
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as { role?: string }).role === "guide") this.canvas.remove(obj);
    });
    const settings = useEditorStore.getState().document?.settings;
    if (!settings?.showBleed && !settings?.showSafeArea) {
      this.sendPageToBack();
      this.skipHistory = false;
      return;
    }
    const bleedPx = inchesToPx(this.bleed);
    const safePx = inchesToPx(this.safe);
    if (settings?.showBleed) {
      this.addGuide("bleed", 0, 0, this.pageWidth, this.pageHeight, "#ef4444", []);
      this.addGuide("trim", bleedPx, bleedPx, this.pageWidth - bleedPx * 2, this.pageHeight - bleedPx * 2, "#f59e0b", [8, 4]);
    }
    if (settings?.showSafeArea) {
      this.addGuide(
        "safe",
        bleedPx + safePx,
        bleedPx + safePx,
        this.pageWidth - (bleedPx + safePx) * 2,
        this.pageHeight - (bleedPx + safePx) * 2,
        "#22c55e",
        [6, 6],
      );
    }
    this.bringGuidesToFront();
    this.sendPageToBack();
    this.skipHistory = false;
  }

  private addGuide(
    name: string,
    left: number,
    top: number,
    width: number,
    height: number,
    stroke: string,
    dash: number[],
  ) {
    const rect = new this.fabric.Rect({
      ...PLACE,
      left,
      top,
      width,
      height,
      fill: "transparent",
      stroke,
      strokeWidth: 1,
      strokeDashArray: dash.length ? dash : undefined,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      role: "guide",
      name,
      id: `guide-${name}`,
    });
    this.canvas.add(rect);
  }

  private setGuidesVisible(visible: boolean) {
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as { role?: string }).role === "guide") obj.visible = visible;
    });
    this.canvas.requestRenderAll();
  }

  private bringGuidesToFront() {
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as { role?: string }).role === "guide") this.canvas.bringObjectToFront(obj);
    });
  }

  refreshGuides() {
    this.redrawGuides();
    this.canvas.requestRenderAll();
  }

  snapshotPage(page: DesignPage): DesignPage {
    return { ...page, designJson: this.serialize(), thumbnailUrl: this.thumbnail() };
  }

  dispose() {
    this.disposing = true;
    this.flushHistoryTimer();
    this.contextMenuHandler = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.viewportEl = null;
    return this.canvas.dispose().catch(() => false);
  }
}

function regularPolygon(sides: number, radius: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push({ x: radius + Math.cos(a) * radius, y: radius + Math.sin(a) * radius });
  }
  return pts;
}

function starPoints(spikes: number, outer: number, inner: number) {
  const pts: { x: number; y: number }[] = [];
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  const cx = outer;
  const cy = outer;
  for (let i = 0; i < spikes; i++) {
    pts.push({ x: cx + Math.cos(rot) * outer, y: cy + Math.sin(rot) * outer });
    rot += step;
    pts.push({ x: cx + Math.cos(rot) * inner, y: cy + Math.sin(rot) * inner });
    rot += step;
  }
  return pts;
}

function presetLabel(id: string) {
  return id.replace("tpl_", "").replaceAll("_", " ");
}

export async function mountEngine(el: HTMLCanvasElement, doc: DesignDocument) {
  const fabric = await import("fabric");
  const page = doc.pages.find((item) => item.id === doc.activePageId) ?? doc.pages[0];
  const engine = new EditorEngine(fabric, el, 1200, 800);
  engine.setPrintGuides(doc.productConfiguration);
  try {
    if (page.designJson && Object.keys(page.designJson).length) {
      await engine.loadJson(page.designJson, false);
    }
  } catch (error) {
    console.warn("Could not restore page JSON", error);
  }
  if (engine.contentObjects().length === 0) {
    engine.applyTemplate("tpl_modern_navy", ["#0f172a", "#38bdf8", "#f8fafc"]);
  }
  useHistoryStore.getState().reset(JSON.stringify(engine.serialize()));
  requestAnimationFrame(() => engine.fitToScreen());
  return engine;
}
