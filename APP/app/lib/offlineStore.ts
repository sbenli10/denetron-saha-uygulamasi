import { get, set, del } from "idb-keyval";

export async function saveDraft(draft: any) {
  const drafts = (await get("inspection-drafts")) || [];
  drafts.push(draft);
  await set("inspection-drafts", drafts);
}

export async function getDrafts() {
  return (await get("inspection-drafts")) || [];
}

export async function clearDrafts() {
  await del("inspection-drafts");
}
