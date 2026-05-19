import { ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ModelDropdownOption = {
  id: string;
  label: string;
};

export type ModelDropdownProps = {
  options: ModelDropdownOption[];
  value: string | null;
  onChange: (id: string) => void;
  ariaLabel: string;
  disabled?: boolean;
};

const menuOffset = 6;
const menuMinWidth = 192;
const menuMaxWidth = 280;

export function ModelDropdown({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.id === value),
    ),
  );
  const [menuRect, setMenuRect] = useState<{
    left: number;
    top: number;
    minWidth: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  const current =
    options.find((opt) => opt.id === value) ?? options[0] ?? null;

  useLayoutEffect(() => {
    if (!open || triggerRef.current == null) return;
    function reposition() {
      const trigger = triggerRef.current;
      if (trigger == null) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.max(
        menuMinWidth,
        Math.min(menuMaxWidth, rect.width + 80),
      );
      // Tentative top is "above the trigger"; fall back to below if no room.
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const aboveTop = rect.top - menuOffset - menuHeight;
      const belowTop = rect.bottom + menuOffset;
      const top = aboveTop >= 8 ? aboveTop : belowTop;
      setMenuRect({ left: rect.left, top, minWidth: width });
    }
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.id === value);
    if (idx >= 0) setHighlight(idx);
  }, [open, options, value]);

  function commit(idx: number) {
    const opt = options[idx];
    if (opt == null) return;
    onChange(opt.id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(highlight);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlight(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlight(options.length - 1);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={[
          "inline-flex h-8 max-w-[10rem] items-center gap-1 rounded-md px-2 text-xs",
          "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
          "dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <span className="truncate">{current?.label ?? "Select"}</span>
        <ChevronDown className="size-3 shrink-0" aria-hidden />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              tabIndex={-1}
              ref={(node) => {
                menuRef.current = node;
                if (node != null) node.focus();
              }}
              onKeyDown={onListKeyDown}
              style={{
                position: "fixed",
                top: menuRect?.top ?? -9999,
                left: menuRect?.left ?? -9999,
                minWidth: menuRect?.minWidth ?? menuMinWidth,
                maxWidth: menuMaxWidth,
                visibility: menuRect == null ? "hidden" : "visible",
              }}
              className={[
                "z-[100] overflow-hidden rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-zinc-200",
                "dark:bg-zinc-900 dark:ring-zinc-700",
              ].join(" ")}
            >
              {options.map((opt, idx) => {
                const selected = opt.id === value;
                const active = idx === highlight;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => commit(idx)}
                    className={[
                      "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left",
                      active ? "bg-zinc-100 dark:bg-zinc-800" : "bg-transparent",
                      selected
                        ? "font-medium text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 dark:text-zinc-300",
                    ].join(" ")}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected ? (
                      <span className="text-amber-600 dark:text-amber-400">●</span>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
