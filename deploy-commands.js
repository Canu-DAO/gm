import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest' ;
import { Routes } from'discord-api-types/v9';
import { config } from './config.js';

console.log(config);

const commands = [
  new SlashCommandBuilder().setName('gm').setDescription('Returns your gm streak and if you said gm this cycle'),
]
  .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(config.DISCORD_KEY);

rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, '889377541675159602'), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);