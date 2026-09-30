import { ImageResponse } from "next/og";

export const alt = "CertiBlank: free AWS and Azure certification practice. Less memorizing. More understanding.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at build time: sharing previews need no database or external assets.
export default function SocialImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "54px 64px", color: "#172e42", background: "linear-gradient(120deg, #f7f9fc 15%, #e5f3f6 100%)", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 66, fontWeight: 700, letterSpacing: "-4px" }}>
          <span>certi</span><span style={{ color: "#08798c" }}>_</span>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#08798c", marginLeft: 9, marginTop: 12, alignSelf: "flex-start" }} />
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#08798c" }}>certiblank.com</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 35, fontSize: 17, letterSpacing: "2px", color: "#08798c" }}>YOUR NEXT CERTIFICATION STARTS HERE</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 20, fontSize: 68, fontWeight: 700, letterSpacing: "-3px", lineHeight: 1.12 }}>
        <span>Less memorizing.</span>
        <span style={{ color: "#08798c" }}>More understanding.</span>
      </div>
      <div style={{ display: "flex", marginTop: 22, maxWidth: 940, fontSize: 27, lineHeight: 1.45, color: "#496276" }}>Timed mock exams, focused practice, and explanations that make the answer click.</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto", paddingTop: 24, borderTop: "1px solid #c9dce5" }}>
        {["AWS Cloud Practitioner", "Azure Fundamentals"].map(label => <div key={label} style={{ display: "flex", padding: "12px 18px", border: "1px solid #b4d5df", borderRadius: 10, fontSize: 20, background: "#ffffff", color: "#172e42" }}>{label}</div>)}
        <div style={{ display: "flex", marginLeft: "auto", color: "#08798c", fontSize: 20 }}>Free to practice</div>
      </div>
    </div>,
    size,
  );
}
