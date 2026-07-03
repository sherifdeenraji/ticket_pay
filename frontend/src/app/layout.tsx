import type { Metadata } from "next";
// import { Geist, Geist_Mono} from "next/font/google";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

import { AuthProvider } from "@/hooks/useAuth";
import { ToastPortal } from "@/components/toast";

export const metadata: Metadata = {
  title: "TicketPay | OAU Student Transport",
  description: "Secure, digital transport ticketing for OAU Students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
          <ToastPortal />
        </AuthProvider>
      </body>
    </html>
  );
}
