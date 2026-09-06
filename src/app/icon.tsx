import { ImageResponse } from "next/og";
import { getMemorialSettings } from "@/lib/memorial";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default async function Icon() {
  const settings = await getMemorialSettings();

  try {
    if (settings.heroImageUrl) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.heroImageUrl}
              alt=""
              width={size.width}
              height={size.height}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ),
        { ...size },
      );
    }
  } catch {
    // Hero image unreachable at render time — fall through to the initial.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f2d2b",
          color: "#fbf8f2",
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {settings.displayName.charAt(0)}
      </div>
    ),
    { ...size },
  );
}
