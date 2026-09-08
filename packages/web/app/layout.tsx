import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

const vazirmatn = Vazirmatn({ subsets: ["arabic"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "محله",
  description: "شبکه اجتماعی محلی محله - جایی برای دور هم بودن اهالی شهر",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <SiteNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
