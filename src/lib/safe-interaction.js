const { DiscordAPIError } = require('discord.js');
const logger = require('./logger');

// Discord interaction tokens expire 15 minutes after creation, but the
// initial response window is only 3 seconds. A reply attempt after the
// window has closed surfaces as `DiscordAPIError` with a 10062
// "Unknown interaction" or 40060 "Already acknowledged" code.
const TRANSIENT_API_CODES = new Set([
  10062, // Unknown interaction
  40060, // Interaction has already been acknowledged
]);

/**
 * Reply to an interaction, choosing reply vs. followUp based on whether
 * the interaction has already been answered. Swallows transient API errors
 * (token expired, already acknowledged, rate-limited) so a failed UX reply
 * never crashes the worker.
 *
 * The discord.js REST manager already retries 429 internally with
 * Retry-After honoured. By the time a 429 reaches us it's a hard limit;
 * we log and drop.
 */
async function safeRespond(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(payload);
    }
    return await interaction.reply(payload);
  } catch (error) {
    if (error instanceof DiscordAPIError && TRANSIENT_API_CODES.has(error.code)) {
      logger.warn('safe-interaction', 'transient API error, dropping reply', {
        code: error.code,
        message: error.message,
      });
      return null;
    }
    if (error?.name === 'RateLimitError' || error?.code === 429) {
      logger.warn('safe-interaction', 'rate-limited by Discord, dropping reply', {
        retryAfter: error.retryAfter ?? error.timeToReset ?? null,
      });
      return null;
    }
    logger.error('safe-interaction', 'Reply failed', {
      error: error?.message ?? String(error),
    });
    return null;
  }
}

module.exports = { safeRespond };
