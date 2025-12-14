/**
 * Client-side script for Delete Account Dialog
 * Handles mounting and interaction logic
 */

import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { DeleteAccountDialog } from "../../components/auth/DeleteAccountDialog";

export function initializeDeleteAccountDialog() {
  const button = document.getElementById("deleteAccountButton");
  const dialogRoot = document.getElementById("deleteAccountDialogRoot");

  if (!dialogRoot) {
    return;
  }

  const root = createRoot(dialogRoot);
  let isOpen = false;

  const render = () => {
    root.render(
      createElement(DeleteAccountDialog, {
        isOpen,
        onClose: () => {
          isOpen = false;
          render();
        },
        userEmail: document.querySelector("[data-user-email]")?.getAttribute("data-user-email") || "user@example.com",
      })
    );
  };

  button?.addEventListener("click", () => {
    isOpen = true;
    render();
  });

  // Initial render
  render();
}
