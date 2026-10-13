"use client";

import { useEffect, useRef, useState } from "react";

type Crop = { x: number; y: number; width: number; height: number };
type Props = { src: string; fileName: string; onApply: (file: File) => void; onCancel: () => void };
const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 420;

export default function ImageEditor({ src, fileName, onApply, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageBoundsRef = useRef<Crop>({ x: 0, y: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT });
  const dragRef = useRef<{ x: number; y: number; crop: Crop; resize: boolean } | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      imageRef.current = image;
      setCrop(null);
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!image || !canvas || !context) return;
    const quarterTurn = Math.abs(rotation % 180) === 90;
    const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
    const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
    const scale = Math.min(STAGE_WIDTH / rotatedWidth, STAGE_HEIGHT / rotatedHeight);
    const width = rotatedWidth * scale;
    const height = rotatedHeight * scale;
    const x = (STAGE_WIDTH - width) / 2;
    const y = (STAGE_HEIGHT - height) / 2;
    imageBoundsRef.current = { x, y, width, height };
    canvas.width = STAGE_WIDTH;
    canvas.height = STAGE_HEIGHT;
    context.fillStyle = "#09090b";
    context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    context.save();
    context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    context.translate(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
    context.restore();
    if (!crop) {
      const aspect = 5 / 7;
      let cropWidth = width * 0.88;
      let cropHeight = cropWidth / aspect;
      if (cropHeight > height * 0.88) {
        cropHeight = height * 0.88;
        cropWidth = cropHeight * aspect;
      }
      setCrop({ x: x + (width - cropWidth) / 2, y: y + (height - cropHeight) / 2, width: cropWidth, height: cropHeight });
    }
  }, [src, rotation, brightness, contrast, saturation, crop]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!crop) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) * (STAGE_WIDTH / bounds.width), y: (event.clientY - bounds.top) * (STAGE_HEIGHT / bounds.height) };
    const resize = point.x >= crop.x + crop.width - 28 && point.y >= crop.y + crop.height - 28;
    dragRef.current = { ...point, crop, resize };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - bounds.left) * (STAGE_WIDTH / bounds.width) - drag.x;
    const dy = (event.clientY - bounds.top) * (STAGE_HEIGHT / bounds.height) - drag.y;
    const current = drag.crop;
    const imageBounds = imageBoundsRef.current;
    if (drag.resize) setCrop({ ...current, width: Math.max(70, Math.min(current.width + dx, imageBounds.x + imageBounds.width - current.x)), height: Math.max(70, Math.min(current.height + dy, imageBounds.y + imageBounds.height - current.y)) });
    else setCrop({ ...current, x: Math.max(imageBounds.x, Math.min(imageBounds.x + imageBounds.width - current.width, current.x + dx)), y: Math.max(imageBounds.y, Math.min(imageBounds.y + imageBounds.height - current.height, current.y + dy)) });
  }

  async function apply() {
    const image = imageRef.current;
    if (!image || !crop) return;
    const quarterTurn = Math.abs(rotation % 180) === 90;
    const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
    const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
    const scale = Math.min(STAGE_WIDTH / rotatedWidth, STAGE_HEIGHT / rotatedHeight);
    const displayWidth = rotatedWidth * scale;
    const displayHeight = rotatedHeight * scale;
    const offsetX = (STAGE_WIDTH - displayWidth) / 2;
    const offsetY = (STAGE_HEIGHT - displayHeight) / 2;
    const sourceX = (crop.x - offsetX) / scale;
    const sourceY = (crop.y - offsetY) / scale;
    const sourceWidth = crop.width / scale;
    const sourceHeight = crop.height / scale;
    const rotated = document.createElement("canvas");
    rotated.width = rotatedWidth;
    rotated.height = rotatedHeight;
    const rotatedContext = rotated.getContext("2d");
    if (!rotatedContext) return;
    rotatedContext.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
    rotatedContext.rotate((rotation * Math.PI) / 180);
    rotatedContext.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    const output = document.createElement("canvas");
    output.width = Math.round(sourceWidth);
    output.height = Math.round(sourceHeight);
    const context = output.getContext("2d");
    if (!context) return;
    context.drawImage(rotated, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, output.width, output.height);
    const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/jpeg", 0.94));
    if (blob) onApply(new File([blob], fileName.replace(/\.[^.]+$/, "") + "-editada.jpg", { type: "image/jpeg" }));
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4" aria-label="Editor de imagen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-medium text-white">Editar imagen</h3><p className="text-xs text-gray-400">Arrastra el marco para moverlo y su esquina inferior derecha para cambiar el recorte.</p></div>
        <div className="flex gap-2"><button type="button" aria-label="Girar a la izquierda" onClick={() => setRotation((value) => (value - 90 + 360) % 360)} className="border border-zinc-700 px-3 py-2 text-sm hover:border-white">↶ 90°</button><button type="button" aria-label="Girar a la derecha" onClick={() => setRotation((value) => (value + 90) % 360)} className="border border-zinc-700 px-3 py-2 text-sm hover:border-white">↷ 90°</button></div>
      </div>
      <div className="relative mx-auto w-full max-w-2xl touch-none overflow-hidden bg-zinc-950" style={{ aspectRatio: `${STAGE_WIDTH}/${STAGE_HEIGHT}` }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Vista previa para recortar" />
        {crop && <div className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_999px_rgb(0_0_0_0.48)]" style={{ left: `${(crop.x / STAGE_WIDTH) * 100}%`, top: `${(crop.y / STAGE_HEIGHT) * 100}%`, width: `${(crop.width / STAGE_WIDTH) * 100}%`, height: `${(crop.height / STAGE_HEIGHT) * 100}%` }}><span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-sm border-2 border-white bg-red-500" /></div>}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {([["Brillo", brightness, setBrightness], ["Contraste", contrast, setContrast], ["Saturación", saturation, setSaturation]] as const).map(([label, value, setValue]) => <label key={label} className="space-y-1 text-xs text-gray-300"><span className="flex justify-between"><span>{label}</span><span>{value}%</span></span><input aria-label={label} type="range" min="50" max="150" value={value} onChange={(event) => setValue(Number(event.target.value))} className="w-full accent-red-500" /></label>)}
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }} className="border border-zinc-700 px-4 py-2 text-sm text-gray-300">Restablecer ajustes</button><button type="button" onClick={onCancel} className="border border-zinc-700 px-4 py-2 text-sm text-gray-300">Cancelar</button><button type="button" onClick={apply} disabled={!crop} className="bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">Aplicar edición</button></div>
    </section>
  );
}
