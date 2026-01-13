import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({ subsets: ["latin", "thai"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Sorting Machine - ระบบคัดแยกขยะอัตโนมัติ",
  description: "แอปพลิเคชันสำหรับเก็บคะแนนจากการนำสินค้าไปรีไซเคิล",
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sorting Machine",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${prompt.className} bg-linear-to-br from-emerald-50 via-white to-teal-50 text-gray-800 min-h-screen antialiased overflow-x-hidden`}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
