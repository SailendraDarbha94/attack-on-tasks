"use client";

import { useEffect } from "react";
import { Splash } from "@/components/brand";
import { auth } from "@/lib/auth";

// Signing out is a page of its own, so the screen you left (and its sign-in
// guard) is out of the way before the session is cleared. It ends with a full
// page load, because Next keeps recently visited pages alive in the background
// and the next person to sign in must not inherit their state.
export default function SignOutPage() {
  useEffect(() => {
    void auth.signOut().then(() => window.location.replace("/"));
  }, []);
  return <Splash />;
}
