"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { categoryLabels, products } from "@/services/mock-data";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const q = query.trim().toLowerCase();
        const matches = !q || product.name.toLowerCase().includes(q) || product.tagline.toLowerCase().includes(q);
        return matches && (category === "all" || product.category === category);
      }),
    [query, category],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Print products"
        description="Every product opens a print-accurate canvas with bleed, trim and safe area."
      />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterChip>
          {Object.entries(categoryLabels).map(([id, label]) => (
            <FilterChip key={id} active={category === id} onClick={() => setCategory(id)}>
              {label}
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative h-48 overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">{categoryLabels[product.category]}</p>
              <h2 className="mt-1 text-lg font-semibold">{product.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{product.tagline}</p>
              <p className="mt-4 text-sm font-medium text-blue-700">From {formatPrice(product.startingPrice)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-2 text-sm",
        active ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
      )}
    >
      {children}
    </button>
  );
}
