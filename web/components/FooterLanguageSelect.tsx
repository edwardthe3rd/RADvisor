"use client";

const LANGUAGES = [{ code: "en", label: "English" }] as const;

export default function FooterLanguageSelect() {
  return (
    <select
      defaultValue="en"
      className="rounded-sm border border-surface-border bg-white px-2 py-1 text-xs text-ink-primary"
      aria-label="Language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
