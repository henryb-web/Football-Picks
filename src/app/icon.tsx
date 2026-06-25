import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon: the PickSix "6" mark.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0891B2",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 900,
          borderRadius: 7,
        }}
      >
        6
      </div>
    ),
    size,
  );
}
