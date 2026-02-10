import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Happy Valentine's Day",
};

export default function ValentinePage() {
  return (
    <iframe
      src="/valentines.html"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
