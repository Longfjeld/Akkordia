export class StorageProvider {
  async connect() {
    throw new Error("Not implemented");
  }

  async disconnect() {
    throw new Error("Not implemented");
  }

  async readJson(_workspaceRef, _path) {
    throw new Error("Not implemented");
  }

  async writeJson(_workspaceRef, _path, _value, _options = {}) {
    throw new Error("Not implemented");
  }

  async list(_workspaceRef, _path) {
    throw new Error("Not implemented");
  }

  async createFolder(_workspaceRef, _path) {
    throw new Error("Not implemented");
  }
}
