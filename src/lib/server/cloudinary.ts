import "server-only";
import { v2 as cloudinary } from "cloudinary";

// El SDK lee CLOUDINARY_URL automáticamente de las variables de entorno.
cloudinary.config({ secure: true });

export function isCloudinaryConfigured(): boolean {
  return !!process.env.CLOUDINARY_URL;
}

/** Sube una imagen (buffer) a Cloudinary y devuelve la URL segura. */
export function uploadImage(bytes: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "thor/products",
        transformation: [{ quality: "auto", fetch_format: "auto", width: 1200, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Falló la subida."));
        else resolve(result.secure_url);
      },
    );
    stream.end(bytes);
  });
}
