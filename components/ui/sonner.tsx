"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#0a0a0a",
          border: "1px solid #222222",
          color: "#ffffff",
          borderRadius: "0",
        },
        className: "cyber-toast",
      }}
    />
  );
}
