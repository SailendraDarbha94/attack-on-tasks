"use client";

import { useState } from "react";
import { Check, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/address-form";
import { Badge, Button, Card, cx, EmptyState, PageTitle } from "@/components/ui";
import { useDb } from "@/lib/db";
import { addressLine } from "@/lib/format";
import { useAccount, useDeliveryAddress } from "@/lib/hooks";
import { useCart } from "@/lib/session";
import type { Account } from "@/lib/types";

export default function AccountPage() {
  const account = useAccount();
  if (!account) return null;
  return <AccountDetails account={account} />;
}

function AccountDetails({ account }: { account: Account }) {
  const addAddress = useDb((s) => s.addAddress);
  const removeAddress = useDb((s) => s.removeAddress);
  const setAddress = useCart((s) => s.setAddress);
  const current = useDeliveryAddress(account);
  const [adding, setAdding] = useState(false);
  const showForm = adding || account.addresses.length === 0;

  return (
    <>
      <PageTitle title="Your account" />

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit p-5">
          <span
            aria-hidden
            className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-mango font-display text-3xl font-extrabold"
          >
            {account.name[0]}
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold">{account.name}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Mail className="size-4 shrink-0" strokeWidth={2.5} />
            <span className="truncate">{account.email}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm">
            <Phone className="size-4 shrink-0" strokeWidth={2.5} />
            {account.phone}
          </p>
          {account.demo ? (
            <Badge className="mt-4" tint="sky">
              Demo account
            </Badge>
          ) : null}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold">Delivery addresses</h2>
            {!showForm ? (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Plus className="size-4" strokeWidth={3} />
                Add address
              </Button>
            ) : null}
          </div>

          {account.addresses.length === 0 ? (
            <div className="mt-4">
              <EmptyState emoji="📍" title="No saved addresses yet">
                Add one below and checkout gets a step shorter.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {account.addresses.map((address) => {
                const selected = current?.id === address.id;
                return (
                  <li
                    key={address.id}
                    className={cx(
                      "flex flex-wrap items-start gap-3 rounded-2xl border-2 border-ink p-4",
                      selected ? "bg-lime shadow-hard-sm" : "bg-paper",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {address.label}
                        {selected ? (
                          <Badge>
                            <Check className="size-3.5" strokeWidth={3} />
                            Delivering here
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-sm">
                        {address.recipient} · {address.phone}
                      </p>
                      <p className="text-sm text-ink-soft">{addressLine(address)}</p>
                    </div>
                    <div className="flex gap-2">
                      {!selected ? (
                        <Button variant="outline" size="sm" onClick={() => setAddress(address.id)}>
                          Deliver here
                        </Button>
                      ) : null}
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => removeAddress(account.id, address.id)}
                        aria-label={`Delete ${address.label} address`}
                      >
                        <Trash2 className="size-4" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {showForm ? (
            <div className="mt-6 border-t-2 border-ink/10 pt-5">
              <h3 className="mb-3 font-bold">New address</h3>
              <AddressForm
                defaultRecipient={account.name}
                defaultPhone={account.phone}
                onCancel={account.addresses.length > 0 ? () => setAdding(false) : undefined}
                onSave={(input) => {
                  const saved = addAddress(account.id, input);
                  setAddress(saved.id);
                  setAdding(false);
                }}
              />
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
