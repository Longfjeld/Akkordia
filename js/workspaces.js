const STORAGE_KEY = "akkordia.workspaces.v1";
const ACTIVE_KEY = "akkordia.activeWorkspace.v1";

export function getWorkspaces() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWorkspace(workspace) {
  const workspaces = getWorkspaces();
  const next = workspaces.filter(item => item.workspaceId !== workspace.workspaceId);
  next.push(workspace);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return workspace;
}

export function removeWorkspace(workspaceId) {
  const next = getWorkspaces().filter(item => item.workspaceId !== workspaceId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (getActiveWorkspaceId() === workspaceId) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getActiveWorkspaceId() {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveWorkspaceId(workspaceId) {
  if (workspaceId) {
    localStorage.setItem(ACTIVE_KEY, workspaceId);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getActiveWorkspace() {
  const activeId = getActiveWorkspaceId();
  return getWorkspaces().find(item => item.workspaceId === activeId) ?? null;
}
