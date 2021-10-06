import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import dayjs from 'dayjs';
import { config } from './config.js';
import { loadJSONdb, configJSONdb, initUser, incrUserStreak, userExist, getUser, clearUserStreak, clearTodayFlags } from './db.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

async function checkForGmToday(id) {
  return await getUser(id).then( x => { return x.today });
}

discord.on('messageCreate', async m => {
  if (!m.author.bot && m.channelId == config.DISCORD_CHANNEL_ID) {
    await loadJSONdb(`${config.storagePath}${m.guildId}`, m.guild.name, m.channel.name, m.channel.id);
    const id = m.author.id;
    const username = `${m.author.username}#${m.author.discriminator}`;
    
    if (m.content.toLowerCase() == config.keyword) {
      if (await userExist(id) == false) {
        await initUser(id, username);
        await incrUserStreak(id);
      } else {
        const check = await checkForGmToday(id);
        if (check == 0) {
          await incrUserStreak(id);
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
    } else if (m.content == '!gm clear') {
      await clearTodayFlags();
    }
  }
});

discord.once('ready', async c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  await discord.channels.cache.get(config.DISCORD_CHANNEL_ID).send('gm');
});

discord.login(config.DISCORD_KEY);

var interval = dayjs().endOf('day').add(1, 'millisecond') - dayjs();
setInterval(function() { 
  clearTodayFlags();
  interval = 24 * 60 * 60 * 1000;
  console.log(`cleared today flag, next clear in ${interval}`);
}, interval);