"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QrDisplayProps {
  url: string;
}

export default function QrDisplay({ url }: QrDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState<string>("");
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    // Generate canvas QR
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: { dark: "#18181b", light: "#ffffff" },
      });
    }

    // Generate PNG data URL for download
    QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
    }).then(setDataUrl);

    // Generate SVG string for download
    QRCode.toString(url, { type: "svg", margin: 2 }).then(setSvgString);
  }, [url]);

  function downloadPng() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = "reviewaware-qr.png";
    link.href = dataUrl;
    link.click();
  }

  function downloadSvg() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "reviewaware-qr.svg";
    link.href = blobUrl;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div>
      <canvas ref={canvasRef} className="rounded-lg" />

      <div className="mt-4 flex gap-3">
        <button
          onClick={downloadPng}
          disabled={!dataUrl}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Download PNG
        </button>
        <button
          onClick={downloadSvg}
          disabled={!svgString}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}
