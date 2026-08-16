"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOOLS: { cmd: string; arg?: string; label: string; icon: string }[] = [
  { cmd: "bold", label: "Bold", icon: "B" },
  { cmd: "italic", label: "Italic", icon: "I" },
  { cmd: "underline", label: "Underline", icon: "U" },
  { cmd: "formatBlock", arg: "h2", label: "Heading 2", icon: "H2" },
  { cmd: "formatBlock", arg: "h3", label: "Heading 3", icon: "H3" },
  { cmd: "formatBlock", arg: "p", label: "Paragraph", icon: "¶" },
  { cmd: "insertUnorderedList", label: "Bullet list", icon: "•≡" },
  { cmd: "insertOrderedList", label: "Numbered list", icon: "1≡" },
  { cmd: "formatBlock", arg: "blockquote", label: "Quote", icon: "❝" },
  { cmd: "removeFormat", label: "Clear formatting", icon: "✕" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function emit() {
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-ink-200 bg-white transition-colors", focused && "border-brand-500 ring-4 ring-brand-500/10")}>
      <div className="flex flex-wrap gap-1 border-b border-ink-100 bg-ink-50 px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(t.cmd, t.arg);
            }}
            className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold text-ink-600 hover:bg-white hover:text-brand-700"
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          emit();
        }}
        className="prose-html min-h-[180px] max-w-none px-4 py-3 outline-none"
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a3b0ac;
        }
      `}</style>
    </div>
  );
}
