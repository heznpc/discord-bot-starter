const { SlashCommandBuilder } = require('discord.js');

// Static list — replace with a DB query, API call, or cached list in your bot.
const CHOICES = [
  'apple',
  'banana',
  'cherry',
  'docker',
  'elasticsearch',
  'grafana',
  'kubernetes',
  'postgres',
  'redis',
  'typescript',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search a list with autocomplete')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Start typing to see suggestions')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.reply(`You picked: \`${query}\``);
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = CHOICES.filter((choice) => choice.toLowerCase().includes(focused))
      // Discord caps autocomplete responses at 25 choices.
      .slice(0, 25)
      .map((choice) => ({ name: choice, value: choice }));

    await interaction.respond(matches);
  },
};
