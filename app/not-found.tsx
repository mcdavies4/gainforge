import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "var(--paper, #f7f9f7)",
        color: "var(--ink, #15231d)",
        fontFamily: "'DM Sans', sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "#eaf6ef",
          color: "#16764b",
          display: "grid",
          placeItems: "center",
          marginBottom: "20px",
        }}
      >
        <Compass size={28} />
      </div>

      <h1
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "28px",
          fontWeight: 800,
          margin: "0 0 10px",
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "#78867e",
          maxWidth: "400px",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}
      >
        The page you are looking for doesn&apos;t exist or was moved. Return to the GainForge Growth Workspace to continue.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#16764b",
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} /> Return to Workspace
      </Link>
    </div>
  );
}
