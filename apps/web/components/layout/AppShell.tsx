"use client";

import React, { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface-canvas)] text-[var(--color-neutral-900)]">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile 5-Icon Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
