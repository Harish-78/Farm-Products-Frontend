import React from 'react';
import { Sprout, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground relative overflow-hidden">
      {/* Absolute top-right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Left: Decorative Farm-Themed Showcase Banner (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-950 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Poongodi Farm Products</h1>
            <p className="text-xs text-emerald-300/80 font-medium tracking-wide uppercase">
              Admin & Operations Portal
            </p>
          </div>
        </div>

        {/* Middle: Value Proposition Pitch */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
            <Leaf className="h-3.5 w-3.5" /> 100% Pure Traditional & Organic Farm Produce
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Managing fresh harvest, organic goods, and direct-to-consumer farm orders.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            From wood-pressed oils and pure A2 desi ghee to native honey and fresh harvest baskets, Poongodi brings the farm closer to homes.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-semibold text-white">Quality Assured</h4>
              <p className="text-[11px] text-emerald-200/70 mt-0.5">Cold-pressed & preservative free</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
              <HeartHandshake className="h-5 w-5 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-semibold text-white">Direct Sourced</h4>
              <p className="text-[11px] text-emerald-200/70 mt-0.5">Directly supporting local farmers</p>
            </div>
          </div>
        </div>

        {/* Bottom: Footer info */}
        <div className="relative z-10 text-xs text-emerald-300/60 font-medium">
          © {new Date().getFullYear()} Poongodi Farm Products. All rights reserved.
        </div>
      </div>

      {/* Right: Dynamic Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Header Mobile Brand only */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm tracking-tight">Poongodi Farm Products</span>
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
