"use client";

import { useState, type FormEvent } from "react";
import type { Address } from "@/lib/types";
import { Button, cx, Field, FormError } from "./ui";

const LABELS = ["Home", "Work", "Other"];

export function AddressForm({
  defaultRecipient,
  defaultPhone,
  onSave,
  onCancel,
  submitLabel = "Save address",
}: {
  defaultRecipient: string;
  defaultPhone: string;
  onSave: (address: Omit<Address, "id">) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [label, setLabel] = useState("Home");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const pincode = text("pincode");
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a 6-digit PIN code.");
      return;
    }
    onSave({
      label,
      recipient: text("recipient"),
      phone: text("phone"),
      line1: text("line1"),
      line2: text("line2"),
      area: text("area"),
      city: text("city"),
      pincode,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <p className="mb-1.5 text-sm font-bold">Save as</p>
        <div className="flex gap-2">
          {LABELS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={label === option}
              onClick={() => setLabel(option)}
              className={cx(
                "h-9 rounded-full border-2 border-ink px-4 text-sm font-bold",
                label === option ? "bg-ink text-white" : "bg-paper hover:bg-ink/5",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="recipient" defaultValue={defaultRecipient} autoComplete="name" required />
        <Field label="Phone" name="phone" type="tel" defaultValue={defaultPhone} autoComplete="tel" required />
      </div>
      <Field label="Flat, house or building" name="line1" placeholder="Flat 302, Lotus Residency" autoComplete="address-line1" required />
      <Field label="Street or landmark" name="line2" placeholder="12th Main Road, near the park" autoComplete="address-line2" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Area" name="area" placeholder="Indiranagar" required />
        <Field label="City" name="city" defaultValue="Bengaluru" autoComplete="address-level2" required />
        <Field label="PIN code" name="pincode" inputMode="numeric" placeholder="560038" autoComplete="postal-code" required />
      </div>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
