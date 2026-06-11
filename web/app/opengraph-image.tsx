import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RADvisor - outdoor gear rentals near Reno & Lake Tahoe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #FDF6E3 0%, #E3F2F7 55%, #ffffff 100%)",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 800, color: "#EAB321" }}>
          RADvisor
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            fontWeight: 600,
            color: "#222222",
            maxWidth: 900,
          }}
        >
          Outdoor gear rentals near Reno &amp; Lake Tahoe
        </div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#717171" }}>
          Skis · Kayaks · Bikes · Camping · RVs &amp; more
        </div>
      </div>
    ),
    { ...size },
  );
}
