import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingScreen } from "@/components/ui/loading-screen";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Command Chamber",
  description: "Your personal command center — clients, books, movies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jbMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground grain">
        <LoadingScreen />
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              classNames: {
                toast: "bg-[#1a1a1a] border border-white/10 text-foreground",
                title: "text-foreground font-medium",
                description: "text-muted-foreground text-sm",
                actionButton: "bg-primary text-primary-foreground",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
