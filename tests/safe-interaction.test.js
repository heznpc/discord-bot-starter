const { DiscordAPIError } = require('discord.js');
const { safeRespond } = require('../src/lib/safe-interaction');

function fakeInteraction(state = {}) {
  return {
    deferred: false,
    replied: false,
    reply: jest.fn().mockResolvedValue('reply-result'),
    followUp: jest.fn().mockResolvedValue('followUp-result'),
    editReply: jest.fn().mockResolvedValue('editReply-result'),
    ...state,
  };
}

describe('safeRespond', () => {
  test('uses reply when interaction is fresh', async () => {
    const i = fakeInteraction();
    const r = await safeRespond(i, { content: 'hi' });
    expect(i.reply).toHaveBeenCalled();
    expect(i.editReply).not.toHaveBeenCalled();
    expect(i.followUp).not.toHaveBeenCalled();
    expect(r).toBe('reply-result');
  });

  test('uses editReply for deferred-but-not-replied (was the bug — used to followUp)', async () => {
    const i = fakeInteraction({ deferred: true, replied: false });
    const r = await safeRespond(i, { content: 'hi' });
    expect(i.editReply).toHaveBeenCalled();
    expect(i.followUp).not.toHaveBeenCalled();
    expect(r).toBe('editReply-result');
  });

  test('uses followUp once interaction is replied', async () => {
    const i = fakeInteraction({ replied: true });
    const r = await safeRespond(i, { content: 'hi' });
    expect(i.followUp).toHaveBeenCalled();
    expect(r).toBe('followUp-result');
  });

  test('swallows DiscordAPIError 10062 (Unknown interaction)', async () => {
    const err = new DiscordAPIError({ code: 10062, message: 'Unknown' }, 10062, 404, 'POST', 'url', {});
    const i = fakeInteraction({ reply: jest.fn().mockRejectedValue(err) });
    const r = await safeRespond(i, { content: 'hi' });
    expect(r).toBeNull();
  });

  test('swallows DiscordAPIError 40060 (Already acknowledged)', async () => {
    const err = new DiscordAPIError({ code: 40060, message: 'Already' }, 40060, 400, 'POST', 'url', {});
    const i = fakeInteraction({ reply: jest.fn().mockRejectedValue(err) });
    const r = await safeRespond(i, { content: 'hi' });
    expect(r).toBeNull();
  });

  test('swallows rate-limit-shaped errors', async () => {
    const err = Object.assign(new Error('rate limited'), {
      name: 'RateLimitError',
      retryAfter: 1.5,
    });
    const i = fakeInteraction({ reply: jest.fn().mockRejectedValue(err) });
    const r = await safeRespond(i, { content: 'hi' });
    expect(r).toBeNull();
  });

  test('swallows unexpected errors (no rethrow)', async () => {
    const i = fakeInteraction({ reply: jest.fn().mockRejectedValue(new Error('boom')) });
    const r = await safeRespond(i, { content: 'hi' });
    expect(r).toBeNull();
  });
});
