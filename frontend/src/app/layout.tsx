import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatWidget from "../components/ChatWidget";
import ClientWrapper from "../components/ClientWrapper";
import { AuthProvider } from "../contexts/AuthContext";
// import "../utils/featherFix.js"; // Disabled to prevent DOM errors

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FitConnect - Connect with Your Perfect Trainer",
  description: "Find and book sessions with certified personal trainers. Get personalized workout programs and achieve your fitness goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ClientWrapper>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
            <ChatWidget />
          </ClientWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
