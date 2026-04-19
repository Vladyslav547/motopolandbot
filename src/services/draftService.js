class DraftService {
  constructor(storage) {
    this.storage = storage;
  }

  async getDraft(userId) {
    const data = await this.storage.read();
    const draft = data.drafts[String(userId)];

    return draft ? clone(draft) : null;
  }

  async createDraft(userId, requestText) {
    await this.storage.update((data) => {
      data.drafts[String(userId)] = {
        requestText,
        clarifications: [],
        awaitingClarification: false,
        submitting: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }

  async resetDraft(userId) {
    await this.storage.update((data) => {
      delete data.drafts[String(userId)];
    });
  }

  async markAwaitingClarification(userId) {
    return this.storage.update((data) => {
      const draft = data.drafts[String(userId)];

      if (!draft) {
        return { ok: false, reason: 'no_draft' };
      }

      if (draft.submitting) {
        return { ok: false, reason: 'submitting' };
      }

      draft.awaitingClarification = true;
      draft.updatedAt = new Date().toISOString();

      return { ok: true };
    });
  }

  async addClarification(userId, clarificationText) {
    return this.storage.update((data) => {
      const draft = data.drafts[String(userId)];

      if (!draft) {
        return { ok: false, reason: 'no_draft' };
      }

      if (draft.submitting) {
        return { ok: false, reason: 'submitting' };
      }

      draft.clarifications.push(clarificationText);
      draft.awaitingClarification = false;
      draft.updatedAt = new Date().toISOString();

      return { ok: true };
    });
  }

  async claimDraftForSending(userId) {
    return this.storage.update((data) => {
      const draft = data.drafts[String(userId)];

      if (!draft) {
        return { ok: false, reason: 'no_draft' };
      }

      if (draft.submitting) {
        return { ok: false, reason: 'submitting' };
      }

      draft.submitting = true;
      draft.awaitingClarification = false;
      draft.updatedAt = new Date().toISOString();

      return {
        ok: true,
        draft: clone(draft)
      };
    });
  }

  async releaseDraft(userId) {
    await this.storage.update((data) => {
      const draft = data.drafts[String(userId)];

      if (!draft) {
        return;
      }

      draft.submitting = false;
      draft.updatedAt = new Date().toISOString();
    });
  }

  async clearDraft(userId) {
    await this.resetDraft(userId);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  DraftService
};
