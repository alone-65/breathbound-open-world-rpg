
import "./globals.css";

export const metadata = {
  title: "BREATHBOUND | Demon Hunter",
  description: "An anime-inspired 3D open-world action RPG."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: "hidden",
          background: "#18251c",
          fontFamily: "Arial, sans-serif"
        }}
      >
        {children}
      </body>
    </html>
  );
}
