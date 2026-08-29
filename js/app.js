import { getActiveWorkspace } from "./workspaces.js";

const workspaceButton = document.querySelector("#workspaceButton");
const phaseNotice = document.querySelector("#phaseNotice");

function renderWorkspace() {
  const workspace = getActiveWorkspace();
  workspaceButton.textContent = workspace ? workspace.name : "Ingen band valgt";
}

function showNotImplemented(action) {
  phaseNotice.textContent =
    `${action} blir aktivert når OneDrive-provideren kobles til i neste trinn.`;
}

document.querySelector("#connectWorkspace").addEventListener("click", () => {
  showNotImplemented("Koble til band");
});

document.querySelector("#createWorkspace").addEventListener("click", () => {
  showNotImplemented("Opprett nytt band");
});

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach(item => {
      item.classList.toggle("is-active", item === button);
    });
  });
});

renderWorkspace();
