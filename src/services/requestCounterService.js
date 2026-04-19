class RequestCounterService {
  constructor(storage) {
    this.storage = storage;
  }

  async peekNextNumber() {
    const data = await this.storage.read();
    return Number(data.counter || 0) + 1;
  }

  async commitNumber(requestNumber) {
    return this.storage.update((data) => {
      const current = Number(data.counter || 0);
      data.counter = Math.max(current, Number(requestNumber));
      return data.counter;
    });
  }
}

module.exports = {
  RequestCounterService
};
