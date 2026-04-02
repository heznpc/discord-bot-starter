const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./commands');
const { loadEvents } = require('./events');
const config = require('./config');
const log = require('./lib/logger');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

loadCommands(client);
loadEvents(client);

const shutdown = () => {
  log.info('lifecycle', 'Shutting down...');
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(config.token).catch((err) => {
  log.error('lifecycle', 'Failed to log in', { error: err.message });
  process.exit(1);
});
