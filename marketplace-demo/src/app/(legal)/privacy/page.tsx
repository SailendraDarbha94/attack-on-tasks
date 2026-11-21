import type { Metadata } from "next";
import { BRAND } from "@/components/brand";
import { LegalDocument, type LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: `Privacy Policy · ${BRAND}`,
  description: `Placeholder privacy policy for the ${BRAND} demo.`,
  // Placeholder legal text should not turn up in search results.
  robots: { index: false },
};

// "privacy@nukkad.demo" is a made-up address. Nothing is delivered to it.
const SECTIONS: LegalSection[] = [
  {
    heading: "What this demo does with your information today",
    blocks: [
      `${BRAND} is a demonstration, and it has no server of its own. The accounts, addresses, carts and orders you create are saved in your own browser and are not sent to us or to anyone else.`,
      "To remove them, use “Reset demo data” in the footer of the home page, or clear this site's data in your browser settings.",
      "The company that hosts this site may keep standard request logs, such as your IP address and browser type, as hosting companies generally do.",
    ],
  },
  {
    heading: "Information the real service would collect",
    blocks: [
      "When the service launches, we expect to collect:",
      [
        "Account details: your name, email address and phone number.",
        "Delivery addresses that you save or enter at checkout.",
        "Orders: what you bought, from which store, when, and how you chose to pay.",
        "For store accounts: the store's name and area, its products, prices and stock, and the contact details of its vendors.",
        "Basic device and usage information, such as browser type and the pages you visit.",
      ],
      "We would not collect card numbers or UPI credentials. Any online payment would be handled by a payment provider.",
    ],
  },
  {
    heading: "How it would be used",
    blocks: [
      [
        "To take, prepare and deliver your orders.",
        "To show a store what to pack and where to send it.",
        "To help when something goes wrong with an order.",
        "To keep the service working, secure and free of misuse.",
        "To meet legal and tax obligations.",
      ],
    ],
  },
  {
    heading: "Who it would be shared with",
    blocks: [
      [
        "The store you order from sees your name, phone number, delivery address and order.",
        "Delivery partners see what they need to deliver the order.",
        "Companies that run parts of the service for us, such as hosting, payments and messaging.",
        "Authorities, when the law requires it.",
      ],
      "We would not sell your personal information.",
    ],
  },
  {
    heading: "How long it would be kept",
    blocks: [
      "Account details would be kept while your account is open. Order records would be kept for as long as tax and consumer law require, and then deleted or made anonymous.",
    ],
  },
  {
    heading: "Your choices",
    blocks: [
      "You would be able to see, correct and delete your information, and to close your account, from your account page or by writing to us.",
    ],
  },
  {
    heading: "Children",
    blocks: [`${BRAND} is meant for adults. It is not directed at anyone under 18.`],
  },
  {
    heading: "Changes to this policy",
    blocks: ["If this policy changes, the new version will be posted here with a new date at the top."],
  },
  {
    heading: "Contact",
    blocks: [
      "Questions about privacy would go to privacy@nukkad.demo. That is a placeholder address for the demo and does not receive mail.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      summary={`This page explains what ${BRAND} does with personal information. The first section describes the demo as it works today. The rest sketches what a real policy would cover.`}
      sections={SECTIONS}
    />
  );
}
