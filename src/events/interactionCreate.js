const { Events, MessageFlags } = require('discord.js');
const logger = require('../lib/logger');
const { createRateLimiter } = require('../lib/rate-limiter');
const { safeRespond } = require('../lib/safe-interaction');

const limiter = createRateLimiter(5, 60_000);
// unref so the timer never blocks process exit (e.g., in Jest)
setInterval(() => limiter.cleanup(), 120_000).unref();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Autocomplete runs before the command is submitted — dispatch separately.
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command || typeof command.autocomplete !== 'function') return;
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        logger.error('interactionCreate', `Autocomplete failed for ${interaction.commandName}`, { error: error.message });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn('interactionCreate', `Unknown command: ${interaction.commandName}`);
      await safeRespond(interaction, {
        content: `Unknown command: \`${interaction.commandName}\`. It may have been removed.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { limited, retryAfterMs } = limiter.check(interaction.user.id);
    if (limited) {
      logger.warn('interactionCreate', `Rate-limited user ${interaction.user.id}`);
      await safeRespond(interaction, {
        content: `You're sending commands too fast. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error('interactionCreate', `Error executing ${interaction.commandName}`, { error: error.message });
      await safeRespond(interaction, {
        content: 'Something went wrong.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
