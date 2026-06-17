import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

export interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.value === value);
    if (activeIndex === -1) return;

    const buttonElements = Array.from(containerRef.current.querySelectorAll("button"));
    const activeButton = buttonElements[activeIndex];

    if (activeButton) {
      setPillStyle({
        width: activeButton.offsetWidth,
        transform: `translateX(${activeButton.offsetLeft}px)`,
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center rounded-full border border-border bg-surface p-1", className)}
    >
      {/* Sliding Pill */}
      <div
        className="absolute bottom-1 top-1 rounded-full bg-surface-selected transition-all duration-300 ease-out"
        style={pillStyle}
      />

      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 outline-none rounded-full",
              isActive ? "text-accent-hover" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
