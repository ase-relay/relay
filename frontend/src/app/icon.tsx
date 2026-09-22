import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

/** A compact Otewe route-pin mark for browser tabs and installed web apps. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#004BDC",
          borderRadius: 14,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <svg
          aria-label="Otewe"
          fill="none"
          height="48"
          viewBox="0 0 48 48"
          width="48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 6c-7.18 0-13 5.82-13 13 0 9.75 13 23 13 23s13-13.25 13-23c0-7.18-5.82-13-13-13Z"
            fill="#FFFFFF"
          />
          <circle cx="24" cy="19" fill="#F58220" r="6" />
          <path
            d="M24 16v6l4 2"
            stroke="#004BDC"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
        </svg>
      </div>
    ),
    size,
  );
}
