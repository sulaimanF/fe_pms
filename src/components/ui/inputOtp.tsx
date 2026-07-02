"use client";

import React, { useRef } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  disabled = false,
}: OtpInputProps) {

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (
    index: number,
    inputValue: string
  ) => {

    // hanya angka
    const numericValue = inputValue.replace(/\D/g, "");

    // ambil 1 digit saja
    const digit = numericValue.slice(-1);

    const newValue = [...value];
    newValue[index] = digit;

    onChange(newValue);

    // auto focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {

    // backspace pindah ke kiri
    if (
      e.key === "Backspace" &&
      !value[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) =>
            handleChange(index, e.target.value)
          }
          onKeyDown={(e) =>
            handleKeyDown(index, e)
          }
          className="
            h-[70px]
            w-[70px]
            rounded-2xl
            border
            border-gray-300
            bg-white
            text-center
            text-3xl
            font-bold
            outline-none
            transition
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-200
          "
        />
      ))}
    </div>
  );
}