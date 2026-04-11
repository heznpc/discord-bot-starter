const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  async execute(interaction) {
    const response = await interaction.reply({
      content: 'Pinging...',
      withResponse: true,
    });
    const sent = response.resource.message;
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `Pong! Latency: ${latency}ms | API: ${interaction.client.ws.ping}ms`
    );
  },
};
