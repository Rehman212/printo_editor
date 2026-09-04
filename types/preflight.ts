export interface PreflightIssue {
  id: string;
  type: "error" | "warning";
  pageId: string;
  objectId?: string;
  code: string;
  message: string;
}
