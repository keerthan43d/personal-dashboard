"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";

export function LoginScreen() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username.trim(), password);
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 grain opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD600]/3 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-[#FFD600]/30 bg-[#FFD600]/5 mb-4">
            <Lock className="w-6 h-6 text-[#FFD600]" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-[0.12em] uppercase text-[#f5f5f5]">
            Command Chamber
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 tracking-widest uppercase">
            Authenticate to continue
          </p>
        </div>

        {/* Login form */}
        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="space-y-4 border border-white/8 bg-[#111111] p-6"
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Username
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              autoComplete="username"
              className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#FFD600] transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#E60012] font-medium"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={!username.trim() || !password}
            className="w-full bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-10"
          >
            Enter Chamber
          </Button>
        </motion.form>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4 tracking-wider uppercase">
          Personal Dashboard · Secured
        </p>
      </motion.div>
    </div>
  );
}
