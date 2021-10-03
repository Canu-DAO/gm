import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import dayjs from 'dayjs';
import { config } from './config.js';
import { loadJSONdb, configJSONdb, initUser, incrUserStreak, userExist, getUser, clearUserStreak } from './db.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

async function checkTime(id, now) {
  const formerRaw = await getUser(id).then( x => { return x.ts });
  const formerTime = dayjs(formerRaw);
  if ((now > formerTime.add(config.clearanceTimeH,'hours') && now < formerTime.endOf('day').add(1, 'day'))) {
    return 1;
  } else if (now > formerTime.endOf('day').add(1, 'day')) {
    return -1;
  } else {
    return 0;
  }
}

discord.on('messageCreate', async m => {
  if (!m.author.bot && m.channelId == config.DISCORD_CHANNEL_ID) {
    await loadJSONdb(`${config.storagePath}${m.guildId}`, m.guild.name, m.channel.name, m.channel.id);
    const id = m.author.id;
    const username = `${m.author.username}#${m.author.discriminator}`;
    
    if (m.content.toLowerCase() == config.keyword) {
      const now = dayjs().valueOf();
      if (await userExist(id) == false) {
        await initUser(id, username, now);
      } else {
        const check = await checkTime(id, now);
        if (check == 1) {
          await incrUserStreak(id, now);
        } else if (check == -1) {
          await clearUserStreak(id, now);
        }
      }

      // !commands
    } else if (m.content == '!gm') {
      const streak = await getUser(id).then( d => { 
        if (d == undefined) {
          return 0;
        } else {
          return d.streak;
        }
      });
      m.reply(`gm ${username}, you have a streak of ${streak}.`);
    }
  }
});

discord.once('ready', async c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  //await discord.channels.cache.get(config.DISCORD_CHANNEL_ID).send('gm');
});

discord.login(config.DISCORD_KEY);
