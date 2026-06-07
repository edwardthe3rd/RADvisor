"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  initialValue = "",
  placeholder = "Find outdoor gear rentals",
}: {
  initialValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl" role="search">
      <div className="flex items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 shadow-sm focus-within:border-brand-primary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-tertiary"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search rentals"
          className="w-full bg-transparent text-ink-primary outline-none placeholder:text-ink-tertiary"
        />
      </div>
    </form>
  );
}
