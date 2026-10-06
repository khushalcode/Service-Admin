"use client";

import { SigninModal } from "@/components/auth/signin-modal";
import { SignupModal } from "@/components/auth/signup-modal";
import { LoginRequiredSheet } from "@/components/auth/login-required-sheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useConsent } from "@/lib/consent-context";
import {
  closeAuthModal,
  closeLoginGate,
  openAuthModal,
  switchAuthMode,
} from "@/store/slices/auth-modal-slice";

/**
 * Single app-wide instance of the sign-in/sign-up dialogs — mounted once in
 * the root layout. Anything that needs auth dispatches openAuthModal(...)
 * (see useRequireAuth) instead of mounting its own SigninModal/SignupModal.
 */
export function AuthModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.authModal.open);
  const mode = useAppSelector((state) => state.authModal.mode);
  const gateOpen = useAppSelector((state) => state.authModal.gateOpen);
  // A guest landing on a private route (e.g. a copied URL in a fresh/private
  // tab) triggers both the cookie consent dialog and this modal on the same
  // mount — stacking them is confusing and Radix's overlays fight each other.
  // Hold this modal closed until the consent dialog is dismissed; the redux
  // open/gateOpen flags stay set in the meantime, so it opens right after.
  const { showDialog: cookieDialogOpen } = useConsent();

  return (
    <>
      <LoginRequiredSheet
        open={gateOpen && !cookieDialogOpen}
        onOpenChange={(next) => (next ? undefined : dispatch(closeLoginGate()))}
        onLogin={() => dispatch(openAuthModal("signin"))}
      />
      <SigninModal
        open={open && mode === "signin" && !cookieDialogOpen}
        onOpenChange={(next) => (next ? undefined : dispatch(closeAuthModal()))}
        onSwitchToSignUp={() => dispatch(switchAuthMode("signup"))}
      />
      <SignupModal
        open={open && mode === "signup" && !cookieDialogOpen}
        onOpenChange={(next) => (next ? undefined : dispatch(closeAuthModal()))}
        onSwitchToSignIn={() => dispatch(switchAuthMode("signin"))}
      />
    </>
  );
}
