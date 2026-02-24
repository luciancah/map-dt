"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

const navItems = [
  { href: "/maps", label: "Maps" },
  { href: "/actors", label: "Actors" },
  { href: "/robots", label: "Robots" },
  { href: "/world-editor", label: "World Builder" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <Card className="w-full">
      <div className="flex flex-wrap gap-2 p-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                active
                  ? "border-orange-300 bg-orange-100 text-orange-900"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
