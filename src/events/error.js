const { Events } = require('discord.js');
const logger = require('../lib/logger');

module.exports = {
  name: Events.Error,
  execute(error) {
    logger.error('discord', 'Client encountered an error', { error: error.message });
  },
};
