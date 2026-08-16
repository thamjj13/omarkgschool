"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export interface ToastItem {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];
let counter = 0;

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastItem["type"] = "success") {
  const id = ++counter;
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => dismiss(id), 4500);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const icons: Record<ToastItem["type"], { icon: IconName; cls: string }> = {
  success: { icon: "check", cls: "bg-emerald-600" },
  error: { icon: "alert", cls: "bg-rose-600" },
  info: { icon: "info", cls: "bg-sky-600" },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    const fn = (t: ToastItem[]) => setItems(t);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-xl bg-ink-900 p-4 text-sm text-white shadow-2xl animate-fade-up"
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              icons[t.type].cls
            )}
          >
            <Icon name={icons[t.type].icon} size={12} strokeWidth={3} />
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-white" aria-label="Dismiss">
            <Icon name="x" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
