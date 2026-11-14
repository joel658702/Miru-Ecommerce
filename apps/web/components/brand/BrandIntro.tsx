"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

export interface BrandIntroProps {
  onComplete?: () => void;
}

const STORAGE_KEY = "miru_brand_intro_seen";

export function BrandIntro({ onComplete }: BrandIntroProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if already seen in current session
    if (typeof window !== "undefined") {
      const alreadySeen = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen) {
        onComplete?.();
        return;
      }

      // Check prefers-reduced-motion
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setReducedMotion(prefersReduced);
      setVisible(true);

      // Dismiss after 2s max
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 2000);

      // Keyboard listener for Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleDismiss();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setFading(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "true");
    }
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 250);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introducción de marca Miru"
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B101E] transition-opacity duration-250 cursor-pointer ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center justify-center max-w-sm w-full p-6 text-center">
        {reducedMotion ? (
          // Static poster for prefers-reduced-motion
          <div className="relative w-64 h-64 flex items-center justify-center">
            <Image
              src="/brand/logo-poster.svg"
              alt="Logo Miru Grow"
              width={256}
              height={256}
              priority
              className="object-contain"
            />
          </div>
        ) : (
          // Native HTML5 video player (zero extra dependencies, fast, hardware-accelerated)
          <div className="relative w-full max-w-sm aspect-video overflow-hidden rounded-2xl">
            <video
              src="/brand/logo-animated.mp4"
              poster="/brand/logo-poster.svg"
              autoPlay
              muted
              playsInline
              onEnded={handleDismiss}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="font-display text-xl font-bold tracking-tight text-white">MIRU GROW</p>
          <p className="text-xs text-[var(--color-neutral-400)]">
            Ecosistema logístico y financiero
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="mt-6 inline-flex min-h-[36px] items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
        >
          <span>Omitir (Esc o clic)</span>
        </button>
      </div>
    </div>
  );
}
