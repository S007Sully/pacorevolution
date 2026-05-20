// Reads EXIF orientation (1-8) from a JPEG file. Returns 1 if missing/unknown.
export async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) return 1;
  const buf = await file.slice(0, 256 * 1024).arrayBuffer();
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset) === 0xffe1) {
      const exifStart = offset + 4;
      if (view.getUint32(exifStart) !== 0x45786966) return 1; // "Exif"
      const tiff = exifStart + 6;
      const little = view.getUint16(tiff) === 0x4949;
      const get16 = (o: number) => view.getUint16(o, little);
      const get32 = (o: number) => view.getUint32(o, little);
      if (get16(tiff + 2) !== 0x002a) return 1;
      const ifd0 = tiff + get32(tiff + 4);
      const entries = get16(ifd0);
      for (let i = 0; i < entries; i++) {
        const entry = ifd0 + 2 + i * 12;
        if (get16(entry) === 0x0112) return get16(entry + 8);
      }
      return 1;
    }
    if ((view.getUint8(offset) !== 0xff)) return 1;
    offset += 2 + view.getUint16(offset + 2);
  }
  return 1;
}

// Returns a normalized JPEG Blob with EXIF orientation baked into pixels.
// Falls back to the original file if processing isn't possible.
export async function normalizeImageOrientation(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const orientation = await readExifOrientation(file);
    const bitmap = await createImageBitmap(file, { imageOrientation: "none" } as ImageBitmapOptions).catch(() => null);
    if (!bitmap) return file;

    const swap = orientation >= 5 && orientation <= 8;
    const w = swap ? bitmap.height : bitmap.width;
    const h = swap ? bitmap.width : bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    switch (orientation) {
      case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, h, w); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
      default: break;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
