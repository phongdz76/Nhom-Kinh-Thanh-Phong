import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

const size = { width: 64, height: 64 };

export default async function Icon() {
  const logo = await readFile(
    path.join(
      process.cwd(),
      "src/frontend/presentation/shared/assets/images/Logo.png",
    ),
  );
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        display: "flex",
        position: "relative",
        borderRadius: 32,
        background: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 5,
          top: 13,
          width: 54,
          height: 38,
          overflow: "hidden",
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={150}
          height={150}
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            left: -48,
            top: -42,
          }}
        />
      </div>
    </div>,
    size,
  );
}
