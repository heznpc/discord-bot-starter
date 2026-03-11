const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../src/config');

if (!config.clientId) {
  console.error('Missing DISCORD_CLIENT_ID. Add it to your .env file.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '..', 'src', 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    if (config.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log('Registered guild commands (available instantly).');
    } else {
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log('Registered global commands (may take up to 1 hour).');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
