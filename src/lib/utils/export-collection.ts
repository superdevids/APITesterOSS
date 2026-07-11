import type { Collection, RequestDefinition, Folder } from "../types";

function safeStringify(obj: unknown, space: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    },
    space
  );
}

export function exportCollectionToJson(
  collection: Collection,
  requests: RequestDefinition[],
  folders: Folder[]
): string {
  const data = {
    exporter: {
      name: "APITester",
      version: "1.0",
    },
    collection: {
      ...collection,
      folders: folders.map((f) => ({
        ...f,
        requests: requests.filter((r) => r.folderId === f.id),
      })),
      requests: requests.filter((r) => !r.folderId),
    },
    exportedAt: new Date().toISOString(),
  };

  return safeStringify(data, 2);
}

export function downloadJson(data: string, filename: string): void {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
