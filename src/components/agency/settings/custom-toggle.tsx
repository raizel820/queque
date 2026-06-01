'use client';

interface CustomToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function CustomToggle({ checked, onCheckedChange, label, description }: CustomToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer ${
          checked
            ? 'bg-emerald-500 shadow-inner shadow-emerald-600/30'
            : 'bg-gray-300 dark:bg-gray-600 shadow-inner shadow-gray-400/30'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-[3px] h-5 w-5 rounded-full shadow-md bg-white transition-all duration-300 ease-in-out ${
            checked
              ? 'start-[25px]'
              : 'start-[3px]'
          }`}
        />
      </button>
    </div>
  );
}
