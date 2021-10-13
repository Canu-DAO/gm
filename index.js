import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import dayjs from 'dayjs';
import { config } from './config.js';
import { loadJSONdb, initUser, incrUserStreak, userExist, getUserStreak, getUserTime, getRank, clearUserStreak } from './db.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

function log(text) {
  console.log(`${new Date().toISOString()}\t${text}`);
}

async function checkTime(id, now) {
  const formerRaw = await getUserTime(id);
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
        await initUser(id, username, now).then(await incrUserStreak(id, now));
      } else {
        const check = await checkTime(id, now);
        if (check == 1) {
          await incrUserStreak(id, now);
        } else if (check == -1) {
          await clearUserStreak(id, now).then(await incrUserStreak(id, now));
        }
      }

      // !commands
    } else if (m.content == '!gm') {
      const streak = await getUserStreak(id).catch( _ => 0 )
      m.reply(`gm ${username}, you have a streak of ${streak}.`);
    } else if (m.content == '!gm rank') {
      const rank = await getRank();
      (rank[0] == undefined || rank[0][1] == '0') ? rank[0] = (['no one', 'NA']) : null;
      (rank[1] == undefined || rank[1][1] == '0') ? rank[1] = (['no one', 'NA']) : null;
      (rank[2] == undefined || rank[2][1] == '0') ? rank[2] = (['no one', 'NA']) : null;
      m.reply(`🥇 ${rank[0][0]} -> ${rank[0][1]}\n🥈 ${rank[1][0]} -> ${rank[1][1]}\n🥉 ${rank[2][0]} -> ${rank[2][1]}\n`);
    }
  }
});

discord.once('ready', async c => {
  log(`Ready! Logged in as ${c.user.tag}`);
  await discord.channels.cache.get(config.DISCORD_CHANNEL_ID).send('gm');
});

discord.login(config.DISCORD_KEY);

var interval = dayjs().endOf('day').add(1, 'millisecond') - dayjs();
setInterval(async function() { 
  await clearTodayFlags();
  interval = 24 * 60 * 60 * 1000;
  log(`Cleared today flag`);
  await discord.channels.cache.get(config.DISCORD_CHANNEL_ID).send('gm');
}, interval);