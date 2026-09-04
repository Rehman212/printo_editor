"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { designsService } from "@/services/designs.service";
import { useUiStore } from "@/stores/ui-store";

export function EditorModals() {
  const open = useUiStore((s) => s.shareOpen);
  const setOpen = useUiStore((s) => s.setShareOpen);
  const doc = useEditorStore((s) => s.document);
  const setDocument = useEditorStore((s) => s.setDocument);
  const [origin, setOrigin] = useState("");

  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);

  const url = doc?.shareToken ? `${origin}/share/${doc.shareToken}` : "";

  return (
    <Modal open={open} title="Share design" onClose={() => setOpen(false)}>
      <p className="mb-4 text-sm text-slate-600">
        Create a read-only public preview. Editing stays in your account.
      </p>
      {url ? (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">{url}</div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">Sharing is currently off.</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            if (!doc) return;
            const next = await designsService.share(doc.projectId, false);
            setDocument(next);
          }}
        >
          Disable
        </Button>
        <Button
          onClick={async () => {
            if (!doc) return;
            const next = await designsService.share(doc.projectId, true);
            setDocument(next);
            const share = `${window.location.origin}/share/${next.shareToken}`;
            await navigator.clipboard.writeText(share);
            toast.success("Share link copied");
          }}
        >
          Enable and copy link
        </Button>
      </div>
    </Modal>
  );
}
