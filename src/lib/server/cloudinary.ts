import "server-only";
import { v2 as cloudinary } from "cloudinary";

// El SDK lee CLOUDINARY_URL automáticamente de las variables de entorno.
cloudinary.config({ secure: true });

export function isCloudinaryConfigured(): boolean {
  return !!process.env.CLOUDINARY_URL;
}

function uploadStream(bytes: Buffer, options: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) reject(error ?? new Error("Falló la subida."));
      else resolve(result.secure_url);
    });
    stream.end(bytes);
  });
}

/**
 * Sube la foto de un producto. Se recorta a un cuadrado fijo (con foco
 * automático) para que todas las camisetas se vean del mismo tamaño en el
 * catálogo, sin importar la proporción de la foto original.
 */
export function uploadProductImage(bytes: Buffer): Promise<string> {
  return uploadStream(bytes, {
    folder: "thor/products",
    transformation: [
      { width: 1000, height: 1000, crop: "fill", gravity: "auto" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
}

/** Sube el comprobante de una transferencia (imagen o PDF) sin recortar. */
export function uploadReceipt(bytes: Buffer): Promise<string> {
  return uploadStream(bytes, {
    folder: "thor/receipts",
    resource_type: "auto", // acepta imágenes y PDFs
    transformation: [{ quality: "auto", fetch_format: "auto", width: 1600, crop: "limit" }],
  });
}
