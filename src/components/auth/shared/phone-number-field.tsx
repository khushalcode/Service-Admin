"use client";

import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { useTranslation } from "@/lib/i18n/translation-context";

export function PhoneNumberField({
  value,
  onChange,
  autoFocus,
  disabled,
  required = true,
  label,
}: {
  value: string;
  /** `nationalNumber` excludes the dial code; `dialCode` has a leading "+" (e.g. "+91"). */
  onChange: (value: string, dialCode: string, nationalNumber: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  return (
    <div className={`flex w-full flex-col items-start gap-2 ${disabled ? "opacity-60" : ""}`}>
      <FormFieldLabel label={label ?? t("auth.phoneField.label")} required={required} />
      <PhoneInput
        country="in"
        value={value}
        onChange={(fullValue, country) => {
          const dialCode = (country as { dialCode?: string })?.dialCode ?? "";
          onChange(fullValue, `+${dialCode}`, fullValue.slice(dialCode.length));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputProps={{ autoFocus }}
        disabled={disabled}
        containerClass="w-full!"
        inputStyle={{
          width: "100%",
          height: "42px",
          fontSize: "1rem",
          fontFamily: "inherit",
          color: "var(--form-field-text)",
          backgroundColor: "var(--form-field-bg)",
          borderColor: focused ? "var(--form-field-focus)" : "var(--form-field-border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: focused ? "0px 0px 0px 3px rgba(11,110,79,0.10)" : "none",
        }}
        buttonStyle={{
          backgroundColor: "var(--form-field-bg)",
          borderColor: focused ? "var(--form-field-focus)" : "var(--form-field-border)",
          borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
        }}
        dropdownStyle={{ color: "#111827" }}
      />
    </div>
  );
}
