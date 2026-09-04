import { Suspense } from "react";
import DesignStartPage from "./design-start-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading…</div>}>
      <DesignStartPage />
    </Suspense>
  );
}
