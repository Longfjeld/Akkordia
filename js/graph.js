import { getAccessToken } from "./auth.js";

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";

async function graphFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Innlogging må fullføres før Graph-kallet kan fortsette.");

  const response = await fetch(`${GRAPH_ROOT}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ? `: ${body.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Microsoft Graph svarte ${response.status}${detail}`);
  }

  return response;
}

export async function postJson(path, value) {
  const response = await graphFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(value)
  });
  return response.json();
}

export async function getJson(path) {
  const response = await graphFetch(path, {
    headers: { Accept: "application/json" }
  });
  return response.json();
}

export async function getFileJson(driveId, itemId) {
  const response = await graphFetch(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`
  );
  return response.json();
}

export async function putFileJson(driveId, itemId, value, eTag = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json"
  };
  if (eTag) headers["If-Match"] = eTag;

  const response = await graphFetch(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`,
    {
      method: "PUT",
      headers,
      body: `${JSON.stringify(value, null, 2)}\n`
    }
  );
  return response.json();
}

export async function createFileJson(driveId, parentItemId, filename, value) {
  const response = await graphFetch(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(parentItemId)}:/${encodeURIComponent(filename)}:/content`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
        "If-None-Match": "*"
      },
      body: `${JSON.stringify(value, null, 2)}\n`
    }
  );
  return response.json();
}
