import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: FieldError;
  containerClassName?: string;
};

export function TextField({
  label,
  error,
  id,
  containerClassName,
  className,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        className={className}
        {...props}
      />
      {error?.message && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  );
}
