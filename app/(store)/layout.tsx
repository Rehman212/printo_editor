import type { ReactNode } from "react";
import { StoreFooter, StoreHeader } from "@/components/layout/store-chrome";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
