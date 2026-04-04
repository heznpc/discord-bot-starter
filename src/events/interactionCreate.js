const { Events } = require('discord.js');
const logger = require('../lib/logger');
const { createRateLimiter } = require('../lib/rate-limiter');

const limiter = createRateLimiter(5, 60_000);
setInterval(() => limiter.cleanup(), 120_000);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn('interactionCreate', `Unknown command: ${interaction.commandName}`);
      try {
        await interaction.reply({
          content: `Unknown command: \`${interaction.commandName}\`. It may have been removed.`,
          ephemeral: true,
        });
      } catch (_) {
        // interaction token expired or already handled
      }
      return;
    }

    const { limited, retryAfterMs } = limiter.check(interaction.user.id);
    if (limited) {
      logger.warn('interactionCreate', `Rate-limited user ${interaction.user.id}`);
      try {
        await interaction.reply({
          content: `You're sending commands too fast. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
          ephemeral: true,
        });
      } catch (_) {
        // interaction token expired or already handled
      }
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error('interactionCreate', `Error executing ${interaction.commandName}`, { error: error.message });
      try {
        const reply = { content: 'Something went wrong.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch (_) {
        // interaction token expired or already handled
      }
    }
  },
};
