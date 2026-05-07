const { createRateLimiter } = require('../src/lib/rate-limiter');

describe('createRateLimiter', () => {
  test('allows up to maxHits within the window', () => {
    const limiter = createRateLimiter(3, 60_000);
    expect(limiter.check('u1').limited).toBe(false);
    expect(limiter.check('u1').limited).toBe(false);
    expect(limiter.check('u1').limited).toBe(false);
  });

  test('limits the (maxHits+1)th call and reports retryAfterMs > 0', () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter.check('u1');
    limiter.check('u1');
    const result = limiter.check('u1');
    expect(result.limited).toBe(true);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  test('isolates per-key budgets', () => {
    const limiter = createRateLimiter(1, 60_000);
    expect(limiter.check('a').limited).toBe(false);
    expect(limiter.check('a').limited).toBe(true);
    // Different key gets a fresh window even though `a` is limited.
    expect(limiter.check('b').limited).toBe(false);
  });

  test('resets the budget after the window elapses', () => {
    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      const limiter = createRateLimiter(1, 1_000);
      expect(limiter.check('u1').limited).toBe(false);
      expect(limiter.check('u1').limited).toBe(true);
      now += 1_001; // step past the window
      expect(limiter.check('u1').limited).toBe(false);
    } finally {
      Date.now = realNow;
    }
  });

  test('cleanup removes stale entries', () => {
    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      const limiter = createRateLimiter(5, 1_000);
      limiter.check('u1');
      limiter.check('u2');
      now += 5_000; // way past the window
      limiter.cleanup();
      // After cleanup, brand-new entry. Same start as `now`.
      const fresh = limiter.check('u1');
      expect(fresh.limited).toBe(false);
    } finally {
      Date.now = realNow;
    }
  });
});
