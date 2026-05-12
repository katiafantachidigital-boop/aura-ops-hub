import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Numeric value in BRL (e.g. 1234.56) */
  value: number | null | undefined;
  /** Returns the new numeric value in BRL */
  onValueChange: (value: number) => void;
  /** Show the "R$" prefix inside the field. Defaults to true. */
  showPrefix?: boolean;
}

/**
 * BRL currency input — banking-app style.
 * The user types only digits; cents fill from the right automatically.
 * Examples while typing:
 *   "5"      -> R$ 0,05
 *   "50"     -> R$ 0,50
 *   "500"    -> R$ 5,00
 *   "12345"  -> R$ 123,45
 *   "1234567"-> R$ 12.345,67
 */
const formatCents = (cents: number): string => {
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, showPrefix = true, className, placeholder, ...props }, ref) => {
    // Keep internal cents state synced with prop
    const cents = Math.round(((value ?? 0) as number) * 100);
    const display = cents > 0 ? formatCents(cents) : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 12); // cap to avoid overflow
      const newCents = digits === "" ? 0 : parseInt(digits, 10);
      onValueChange(newCents / 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow only digits + control keys
      if (
        e.key.length === 1 &&
        !/[0-9]/.test(e.key) &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
      }
    };

    return (
      <div className={cn("relative", className)}>
        {showPrefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            R$
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "0,00"}
          className={cn(showPrefix && "pl-9", "text-right tabular-nums")}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
