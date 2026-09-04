"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { cartService } from "@/services/cart.service";

const links = [
  { href: "/products", label: "Products" },
  { href: "/saved-designs", label: "Saved designs" },
  { href: "/orders", label: "Orders" },
];

export function StoreHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    cartService.list().then(setItems);
  }, [setItems]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Printo</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-slate-600 hover:text-slate-950",
                pathname.startsWith(link.href) && "text-slate-950",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative rounded-lg p-2 hover:bg-slate-100">
            <ShoppingCart className="h-5 w-5" />
            {items.length ? (
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-blue-600 text-center text-[10px] font-semibold leading-4 text-white">
                {items.length}
              </span>
            ) : null}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 sm:flex"
          >
            <User className="h-4 w-4" />
            {user ? user.name : "Sign in"}
          </Link>
          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2 text-sm" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Printo. Print-ready design studio.</p>
        <p>Frontend MVP · Fabric.js editor · Mock NestJS API layer</p>
      </div>
    </footer>
  );
}
