import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf4e7",
          backgroundImage:
            "radial-gradient(circle at 82% 12%, rgba(222,154,38,0.28), transparent 55%), radial-gradient(circle at 8% 85%, rgba(47,143,184,0.22), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 9999,
            border: "6px solid #14323f",
            backgroundColor: "#2f8fb8",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              borderRadius: 9999,
              border: "4px solid #de9a26",
              transform: "rotate(-18deg)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: -1,
            color: "#14323f",
          }}
        >
          THOR<span style={{ color: "#de9a26", marginLeft: 18 }}>IMPORTACIONES</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 34,
            color: "#33525e",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Camisetas de fútbol · Retro &amp; Player
        </div>
      </div>
    ),
    { ...size },
  );
}
