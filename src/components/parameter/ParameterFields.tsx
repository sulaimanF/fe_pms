"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ParameterField {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "date" | "boolean" | "select";
  required?: boolean;
  maxLength?: number;
  help?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  readOnly?: boolean;
}
export default function ParameterFields({
  values,
  fields,
  onChange,
  errors,
  disabled = false,
}: {
  values: Record<string, string | boolean>;
  fields: readonly ParameterField[];
  onChange: (name: string, value: string | boolean) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-[180px_1fr]"
    >
      {fields.map((field) => (
        <div key={field.name} className="contents">
          <label htmlFor={"parameter-" + field.name}>
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <div className="min-w-0 space-y-1">
            {field.kind === "boolean" ? (
              <Checkbox
                id={"parameter-" + field.name}
                disabled={disabled || field.readOnly}
                checked={values[field.name] === true}
                onCheckedChange={(v) => onChange(field.name, v === true)}
                aria-invalid={!!errors[field.name]}
              />
            ) : field.kind === "select" ? (
              <Select
                disabled={disabled || field.readOnly}
                value={String(values[field.name] ?? "")}
                onValueChange={(v) => onChange(field.name, v)}
              >
                <SelectTrigger
                  id={"parameter-" + field.name}
                  className="w-full"
                  aria-invalid={!!errors[field.name]}
                  aria-required={field.required}
                >
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.kind === "textarea" ? (
              <textarea
                id={"parameter-" + field.name}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                readOnly={field.readOnly}
                maxLength={field.maxLength}
                value={String(values[field.name] ?? "")}
                onChange={(e) => onChange(field.name, e.target.value)}
                aria-invalid={!!errors[field.name]}
              />
            ) : (
              <Input
                id={"parameter-" + field.name}
                type={field.kind === "date" ? "date" : "text"}
                readOnly={field.readOnly}
                maxLength={field.maxLength}
                value={String(values[field.name] ?? "")}
                onChange={(e) => onChange(field.name, e.target.value)}
                aria-invalid={!!errors[field.name]}
              />
            )}
            {field.help && (
              <p className="text-sm text-muted-foreground">{field.help}</p>
            )}
            {errors[field.name] && (
              <p role="alert" className="text-sm text-red-600">
                {errors[field.name]}
              </p>
            )}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
