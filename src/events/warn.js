const { Events } = require('discord.js');
const logger = require('../lib/logger');

module.exports = {
  name: Events.Warn,
  execute(message) {
    logger.warn('discord', message);
  },
};
