const { Events } = require('discord.js');
const logger = require('../lib/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info('ready', `Logged in as ${client.user.tag}`);
  },
};
