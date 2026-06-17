import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function Select({ value, onChange, options, placeholder = "Select...", className, compact = false }: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className={cn("relative inline-block w-full", className)}>
          <Listbox.Button
            className={cn(
              "relative w-full cursor-pointer rounded-xl border bg-surface text-left font-medium text-text-primary transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent sm:text-sm",
              compact ? "h-8 px-3 text-xs rounded-lg" : "h-10 px-4 text-sm",
              open ? "border-accent bg-surface-hover" : "border-border hover:bg-surface-hover"
            )}
          >
            <span className="block truncate pr-6">{selectedOption ? selectedOption.label : <span className="text-text-muted">{placeholder}</span>}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className={cn("h-4 w-4 text-text-muted transition-transform duration-200", open && "rotate-180")}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      "relative cursor-pointer select-none rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-colors",
                      active ? "bg-surface-hover text-text-primary" : "text-text-primary"
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={cn("block truncate", selected ? "font-medium text-accent" : "font-normal")}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-accent">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
