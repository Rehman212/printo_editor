"use client";

import { useDropzone } from "react-dropzone";
import { HexColorPicker } from "react-colorful";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useEngine } from "@/features/editor/engine/engine-context";
import { useCanvasStore } from "@/features/editor/stores/canvas-store";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { libraryImages } from "@/services/mock-data";
import { products } from "@/services/mock-data";
import { quotePrice } from "@/services/pricing.service";
import { templatesService, uploadsService } from "@/services/templates.service";
import { applyOrientation } from "@/services/products.service";
import { cn } from "@/lib/utils";
import { formatSize } from "@/lib/units";
import { formatPrice } from "@/lib/format";
import { FEATURED_COLORS, SHAPE_PRESETS } from "@/features/editor/shapes/catalog";
import { ShapeGlyph } from "@/features/editor/shapes/shape-glyph";
import { calculateDpi, dpiLabel, dpiStatus } from "@/lib/dpi";

export function TextPanel() {
  const { engine } = useEngine();
  function add(run: () => void) {
    if (!engine) {
      toast.error("Canvas is starting… try again in a moment");
      return;
    }
    run();
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Click to add editable text to the canvas.</p>
      <Button className="w-full" variant="secondary" onClick={() => add(() => engine!.addHeading())}>
        Add heading
      </Button>
      <Button className="w-full" variant="outline" onClick={() => add(() => engine!.addSubheading())}>
        Add subheading
      </Button>
      <Button className="w-full" variant="outline" onClick={() => add(() => engine!.addBody())}>
        Add body text
      </Button>
    </div>
  );
}

export function ShapesPanel() {
  const { engine } = useEngine();
  function run(kind: import("@/features/editor/shapes/catalog").ShapeKind) {
    if (!engine) {
      toast.error("Canvas is still loading. Wait a second, then click again.");
      return;
    }
    engine.addPresetShape(kind);
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {SHAPE_PRESETS.map((item) => (
        <button
          key={item.id}
          title={item.label}
          onClick={() => run(item.id)}
          className="flex aspect-square items-center justify-center rounded-xl bg-[#eee] hover:bg-[#e4e4e4]"
        >
          <ShapeGlyph kind={item.id} />
        </button>
      ))}
    </div>
  );
}

export function IconsPanel() {
  const { engine } = useEngine();
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["check", "heart", "pin"] as const).map((kind) => (
        <Button key={kind} variant="outline" onClick={() => engine?.addIcon(kind)}>
          {kind}
        </Button>
      ))}
    </div>
  );
}

export function BackgroundPanel() {
  const { engine } = useEngine();
  const [tab, setTab] = useState<"color" | "pattern">("color");
  const [hex, setHex] = useState("#FFFFFF");
  const [tile, setTile] = useState(48);

  function applyColor(color: string) {
    setHex(color.toUpperCase());
    engine?.setBackgroundColor(color);
  }

  async function pick() {
    const EyeDropperCtor = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropperCtor) {
      toast.message("Eyedropper is not supported in this browser.");
      return;
    }
    const result = await new EyeDropperCtor().open();
    applyColor(result.sRGBHex);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b border-slate-200 text-sm font-medium">
        {(["color", "pattern"] as const).map((item) => (
          <button
            key={item}
            className={cn(
              "pb-2 capitalize",
              tab === item ? "border-b-2 border-[#3d5245] text-[#3d5245]" : "text-slate-500",
            )}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "color" ? (
        <>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-200 px-2 py-1.5 text-xs">HEX</span>
            <Input value={hex} onChange={(e) => applyColor(e.target.value)} className="h-9" />
            <button type="button" className="rounded-md border border-slate-200 p-2 text-xs" onClick={() => void pick()}>
              Drop
            </button>
            <button
              type="button"
              title="No color"
              className="h-9 w-9 rounded-md border border-slate-200 bg-[linear-gradient(to_bottom_right,transparent_46%,#ef4444_46%,#ef4444_54%,transparent_54%)]"
              onClick={() => applyColor("#ffffff")}
            />
          </div>
          <HexColorPicker color={hex} onChange={applyColor} />
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Featured Colors</p>
            <div className="grid grid-cols-6 gap-1.5">
              {FEATURED_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-7 rounded-sm border border-black/10"
                  style={{ background: color }}
                  onClick={() => applyColor(color)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Or choose a shape</p>
          <div className="grid grid-cols-4 gap-2">
            {SHAPE_PRESETS.slice(0, 8).map((item) => (
              <button
                key={item.id}
                className="flex aspect-square items-center justify-center rounded-xl bg-[#eee]"
                onClick={() => engine?.setPagePattern(item.id, tile)}
              >
                <ShapeGlyph kind={item.id} />
              </button>
            ))}
          </div>
          <div>
            <Label>Size</Label>
            <Input
              type="number"
              min={16}
              max={160}
              value={tile}
              onChange={(e) => setTile(Number(e.target.value) || 48)}
            />
          </div>
        </>
      )}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3d5245] py-2.5 text-xs font-semibold uppercase tracking-wide text-white"
        onClick={() => engine?.clearBackground()}
      >
        Clear background
      </button>
    </div>
  );
}

export function QrPanel() {
  const { engine } = useEngine();
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const content = String(form.get("content") || "");
        const dark = String(form.get("fg") || "#111827");
        const light = String(form.get("bg") || "#ffffff");
        const dataUrl = await QRCode.toDataURL(content, {
          errorCorrectionLevel: "M",
          color: { dark, light },
          margin: 1,
          width: 512,
        });
        await engine?.addQr(dataUrl);
        toast.success("QR code added");
      }}
    >
      <div>
        <Label>URL or text</Label>
        <Textarea name="content" placeholder="https://yourbrand.com" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Foreground</Label>
          <Input name="fg" defaultValue="#111827" />
        </div>
        <div>
          <Label>Background</Label>
          <Input name="bg" defaultValue="#ffffff" />
        </div>
      </div>
      <Button className="w-full" type="submit">
        Insert QR code
      </Button>
    </form>
  );
}

export function ImagesPanel() {
  const { engine } = useEngine();
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Royalty-free library for the MVP. Swap with Pexels later.</p>
      <div className="grid grid-cols-2 gap-2">
        {libraryImages.map((image) => (
          <button
            key={image.id}
            className="overflow-hidden rounded-xl border border-slate-200 text-left"
            onClick={async () => {
              try {
                await engine?.addImageFromUrl(image.url, image.name, 1200, 800);
              } catch {
                toast.error("Could not add this image");
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.name} className="h-20 w-full object-cover" />
            <span className="block px-2 py-1 text-[11px] text-slate-600">{image.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function UploadsPanel() {
  const { engine } = useEngine();
  const uploads = useQuery({ queryKey: ["uploads"], queryFn: uploadsService.list });
  const save = useMutation({
    mutationFn: uploadsService.complete,
    onSuccess: () => uploads.refetch(),
  });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".tif", ".tiff", ".heic"],
      "application/pdf": [".pdf"],
    },
    maxSize: 200 * 1024 * 1024,
    noClick: true,
    onDrop: async (files) => {
      for (const file of files) {
        if (file.type === "application/pdf") {
          toast.message("PDF imported as a preview page. Editable PDF layers come later.");
        }
        const asset = await uploadsService.createLocalAsset(file);
        await save.mutateAsync(asset);
        if (asset.type !== "pdf") await engine?.addImageFromUrl(asset.url, asset.name, asset.width, asset.height);
      }
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "rounded-lg border border-dashed border-[#3d5245] bg-[#f6f1e8] px-4 py-8 text-center",
          isDragActive && "bg-[#efe8d8]",
        )}
      >
        <input {...getInputProps()} />
        <p className="mb-3 text-sm text-slate-600">Drag or drop here to upload or</p>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 rounded-full bg-[#3d5245] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Browse your files
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["Device", "Drive", "Dropbox", "OneDrive"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              label === "Device" ? open() : toast.message(`${label} connects when the NestJS upload API is live.`)
            }
            className="rounded-lg border border-slate-200 bg-white py-3 text-[10px] font-medium text-slate-600"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-slate-500">
        JPG, JPEG, PNG, GIF, TIFF, BMP, SVG, PDF, HEIC, WEBP
        <br />
        Max file size: 200 MB
      </p>
      <div className="space-y-2">
        {uploads.data?.map((asset) => {
          const dpi = calculateDpi(asset.width, 3.5);
          return (
            <button
              key={asset.id}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2 text-left hover:bg-slate-50"
              onClick={async () => {
                try {
                  await engine?.addImageFromUrl(asset.url, asset.name, asset.width, asset.height);
                } catch {
                  toast.error("Could not add this image to the canvas");
                }
              }}
            >
              {asset.type !== "pdf" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200 text-[10px]">PDF</div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{asset.name}</p>
                <p className="text-[11px] text-slate-500">
                  {asset.width}×{asset.height} · {dpiLabel(dpiStatus(dpi))}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TemplatesPanel() {
  const { engine } = useEngine();
  const list = useQuery({ queryKey: ["templates"], queryFn: () => templatesService.list() });
  return (
    <div className="space-y-3">
      {list.data?.map((tpl) => (
        <button
          key={tpl.id}
          className="w-full overflow-hidden rounded-xl border border-slate-200 text-left hover:border-blue-300"
          onClick={() => {
            if (!engine) {
              toast.error("Canvas is still loading. Wait a second, then click again.");
              return;
            }
            engine.applyTemplate(tpl.id, tpl.palette);
            toast.success(`${tpl.name} applied`);
          }}
        >
          <div className="flex h-16" style={{ background: tpl.palette[0] }}>
            <div className="w-8" style={{ background: tpl.palette[1] }} />
            <div className="flex flex-1 items-center px-3 text-sm font-medium text-white">{tpl.name}</div>
          </div>
          <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500">{tpl.categoryId}</p>
        </button>
      ))}
    </div>
  );
}

export function ConfigurationPanel() {
  const document = useEditorStore((s) => s.document);
  const patch = useEditorStore((s) => s.patchDocument);
  const { engine } = useEngine();
  if (!document) return null;
  const product = products.find((item) => item.id === document.productId);
  if (!product) return null;
  const config = document.productConfiguration;

  function update(next: typeof config) {
    next.price = quotePrice(product!, next);
    patch({ productConfiguration: next });
    engine?.setPrintGuides(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Size</Label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          value={`${config.width}:${config.height}`}
          onChange={(e) => {
            const size = product.sizes.find((item) => `${item.width}:${item.height}` === e.target.value);
            if (!size) return;
            update({ ...config, width: size.width, height: size.height, unit: size.unit });
          }}
        >
          {product.sizes.map((size) => (
            <option key={size.id} value={`${size.width}:${size.height}`}>
              {size.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Orientation</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["landscape", "portrait"] as const).map((orientation) => (
            <Button
              key={orientation}
              variant={config.orientation === orientation ? "primary" : "outline"}
              onClick={() => update(applyOrientation(config, orientation))}
            >
              {orientation}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Sides</Label>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          value={config.sides}
          onChange={(e) => update({ ...config, sides: e.target.value as "single" | "double" })}
        >
          <option value="single">Single sided</option>
          <option value="double">Front and back</option>
        </select>
      </div>
      <p className="text-xs text-slate-500">{formatSize(config.width, config.height, config.unit)}</p>
    </div>
  );
}

export function LayersPanel() {
  const { engine } = useEngine();
  useCanvasStore((s) => s.layerVersion);
  const layers = engine?.layers() ?? [];

  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const ids = layers.map((layer) => layer.id);
    const oldIndex = ids.indexOf(String(event.active.id));
    const newIndex = ids.indexOf(String(event.over.id));
    engine?.reorder(arrayMove(ids, oldIndex, newIndex));
  }

  if (!layers.length) return <p className="text-sm text-slate-500">No layers yet.</p>;

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={layers.map((layer) => layer.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {layers.map((layer) => (
            <SortableLayer key={layer.id} layer={layer} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableLayer({
  layer,
}: {
  layer: { id: string; name: string; visible: boolean; locked: boolean };
}) {
  const { engine } = useEngine();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: layer.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2"
    >
      <button {...attributes} {...listeners} className="text-slate-400">
        <GripVertical className="h-4 w-4" />
      </button>
      <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => engine?.selectById(layer.id)}>
        {layer.name}
      </button>
      <button onClick={() => engine?.toggleVisibility(layer.id)}>
        {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={() => engine?.toggleLock(layer.id)}>
        {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </button>
    </div>
  );
}
