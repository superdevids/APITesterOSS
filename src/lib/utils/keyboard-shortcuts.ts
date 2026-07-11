export interface ShortcutDef {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  category: string;
}

export const SHORTCUTS_CONFIG: ShortcutDef[] = [
  { id: "send-request", key: "Enter", ctrl: true, label: "Send request", category: "Request" },
  { id: "save-request", key: "s", ctrl: true, label: "Save request", category: "Request" },
  { id: "save-request-as", key: "s", ctrl: true, shift: true, label: "Save As", category: "Request" },
  { id: "history-back", key: "[", ctrl: true, label: "Navigate history back", category: "Navigation" },
  { id: "history-forward", key: "]", ctrl: true, label: "Navigate history forward", category: "Navigation" },
  { id: "switch-environment", key: "e", ctrl: true, shift: true, label: "Switch environment", category: "Environment" },
  { id: "copy-as-curl", key: "c", ctrl: true, shift: true, label: "Copy as cURL", category: "Tools" },
  { id: "close-modal", key: "Escape", label: "Close modals / Cancel request", category: "General" },
];

export function handleKeydown(e: KeyboardEvent): ShortcutDef | null {
  for (const shortcut of SHORTCUTS_CONFIG) {
    const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    const altMatch = shortcut.alt ? e.altKey : !e.altKey;
    if (ctrlMatch && shiftMatch && altMatch && e.key === shortcut.key) {
      return shortcut;
    }
  }
  return null;
}

export function registerShortcuts(handlers: Record<string, () => void>): () => void {
  function listener(e: KeyboardEvent) {
    const matched = handleKeydown(e);
    if (matched && handlers[matched.id]) {
      e.preventDefault();
      e.stopPropagation();
      handlers[matched.id]();
    }
  }
  document.addEventListener("keydown", listener);
  return () => document.removeEventListener("keydown", listener);
}
