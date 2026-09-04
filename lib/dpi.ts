export type DpiStatus = "excellent" | "good" | "warning" | "poor";

export function calculateDpi(originalPixels: number, printedSizeInches: number) {
  if (printedSizeInches <= 0) return 0;
  return originalPixels / printedSizeInches;
}

export function dpiStatus(dpi: number): DpiStatus {
  if (dpi >= 300) return "excellent";
  if (dpi >= 200) return "good";
  if (dpi >= 150) return "warning";
  return "poor";
}

export function dpiLabel(status: DpiStatus) {
  switch (status) {
    case "excellent":
      return "Print ready";
    case "good":
      return "Good quality";
    case "warning":
      return "Low resolution";
    case "poor":
      return "Poor quality";
  }
}
