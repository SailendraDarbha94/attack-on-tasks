import type { Metadata } from "next";
import { BRAND } from "@/components/brand";
import { LegalDocument, type LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: `Terms of Service · ${BRAND}`,
  description: `Placeholder terms of service for the ${BRAND} demo.`,
  // Placeholder legal text should not turn up in search results.
  robots: { index: false },
};

// "support@nukkad.demo" is a made-up address. Nothing is delivered to it.
const SECTIONS: LegalSection[] = [
  {
    heading: "This is a demo",
    blocks: [
      `${BRAND} is a demonstration. The stores, products and prices are made up. No order placed here is real: nothing is charged and nothing will be delivered.`,
      "The sections below sketch the terms a real service would have.",
    ],
  },
  {
    heading: `Using ${BRAND}`,
    blocks: [
      "You would need to be at least 18 to use the service, and to give accurate information when you sign up and when you order.",
    ],
  },
  {
    heading: "Accounts",
    blocks: [
      "There are two kinds of account: customer accounts for ordering, and store accounts for running a shop. You would be responsible for what happens under your account and for keeping your sign-in details to yourself.",
    ],
  },
  {
    heading: "Orders, prices and payment",
    blocks: [
      [
        "Each store sets its own prices, stock and delivery fee.",
        "Placing an order is a request. The store can accept or reject it, for example when an item has run out.",
        "A store may set a minimum order value.",
        "Payment would be made on delivery by UPI or cash, or online through a payment provider.",
      ],
    ],
  },
  {
    heading: "For stores",
    blocks: [
      [
        "Keep your prices, stock and opening status accurate.",
        "Fulfil the orders you accept, or reject them promptly if you cannot.",
        "Sell only what you are legally allowed to sell, at or below the printed maximum retail price.",
        "The vendor details and purchase orders you record are yours. We would not share them with other stores.",
      ],
    ],
  },
  {
    heading: "Acceptable use",
    blocks: [
      "You would agree not to misuse the service. That includes placing orders you do not intend to accept, listing unlawful goods, copying the service's data in bulk, or trying to break or get around its security.",
    ],
  },
  {
    heading: "Content and ownership",
    blocks: [
      `The ${BRAND} name, design and software would belong to us. Product details and photos that a store uploads would remain the store's, with permission for us to display them.`,
    ],
  },
  {
    heading: "Disclaimers and liability",
    blocks: [
      "The service would be provided as it is, without guarantees that it will always be available or free of errors. The goods themselves are sold by the store, which is responsible for their quality.",
    ],
  },
  {
    heading: "Ending your use",
    blocks: [
      "You could close your account at any time. We could suspend or close an account that breaks these terms.",
    ],
  },
  {
    heading: "Changes to these terms",
    blocks: ["If these terms change, the new version will be posted here with a new date at the top."],
  },
  {
    heading: "Governing law",
    blocks: ["The governing law and the place for resolving disputes are to be confirmed before launch."],
  },
  {
    heading: "Contact",
    blocks: [
      "Questions about these terms would go to support@nukkad.demo. That is a placeholder address for the demo and does not receive mail.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      summary={`These terms describe the rules for using ${BRAND}, both for customers who order and for stores that sell.`}
      sections={SECTIONS}
    />
  );
}
