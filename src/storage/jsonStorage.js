const fs = require('node:fs/promises');
const path = require('node:path');

class JsonStorage {
  constructor(filePath, initialData) {
    this.filePath = filePath;
    this.initialData = clone(initialData);
    this.queue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const existing = await fs.readFile(this.filePath, 'utf8');

      if (!existing.trim()) {
        await this.#write(this.initialData);
      } else {
        JSON.parse(existing);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.#write(this.initialData);
        return;
      }

      if (error instanceof SyntaxError) {
        throw new Error(`Storage file contains invalid JSON: ${this.filePath}`);
      }

      throw error;
    }
  }

  async read() {
    const raw = await fs.readFile(this.filePath, 'utf8');

    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse storage JSON: ${this.filePath}`);
    }
  }

  async update(mutator) {
    const operation = this.queue.then(
      () => this.#runUpdate(mutator),
      () => this.#runUpdate(mutator)
    );

    this.queue = operation.then(
      () => undefined,
      () => undefined
    );

    return operation;
  }

  async #runUpdate(mutator) {
    const data = await this.read();
    const result = await mutator(data);
    await this.#write(data);
    return result;
  }

  async #write(data) {
    const tempFilePath = `${this.filePath}.tmp`;
    const payload = `${JSON.stringify(data, null, 2)}\n`;

    await fs.writeFile(tempFilePath, payload, 'utf8');
    await fs.rename(tempFilePath, this.filePath);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  JsonStorage
};
