"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function PeopleSelect({ id, label, value, onChange, options, disabled, required, allLabel = "Pilih" }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: readonly { value: string; label: string }[]; disabled?: boolean; required?: boolean; allLabel?: string;
}) {
  return <div className="space-y-1"><label htmlFor={id} className="text-sm">{label}{required ? " *" : ""}</label>
    <Select value={value || "__empty"} onValueChange={next => onChange(next === "__empty" ? "" : next)} disabled={disabled} required={required}>
      <SelectTrigger id={id} className="w-full" aria-required={required}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="__empty">{allLabel}</SelectItem>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select></div>;
}
