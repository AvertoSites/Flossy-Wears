import { ImageResponse } from "next/og";
import { site } from "@/lib/data/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a5f",
          color: "#fcfaf5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "#e4c87b",
          }}
        >
          Flossy Wears
        </div>
        <div style={{ fontSize: 84, marginTop: 16 }}>Faith you can wear.</div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.8 }}>
          The October 2026 drop · flossywears.co.uk
        </div>
      </div>
    ),
    size,
  );
}
