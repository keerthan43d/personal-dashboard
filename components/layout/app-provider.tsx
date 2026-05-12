"use client";
import { useEffect, useState } from "react";
import { seedIfEmpty } from "@/lib/db/seed";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#FFD600] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase">
            Loading Chamber…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
