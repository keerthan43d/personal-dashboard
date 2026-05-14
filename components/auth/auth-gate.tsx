"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { LoginScreen } from "./login-screen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, check } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    check();
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!authenticated) return <LoginScreen />;

  return <>{children}</>;
}
