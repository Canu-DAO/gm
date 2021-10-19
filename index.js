import { Client, Intents, Permissions } from 'discord.js';
import dayjs from 'dayjs';
import { keys } from './keys.js';
import { mongoConnect, insertGuild, getConfig, initUser, getUser, getRank, incrUserStreak, clearUserStreak } from './mongo.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

function log(text) {
  console.log(`${new Date().toISOString()}\t${text}`);
}

async function checkTime(guildId, userId, now) {
  const formerRaw = await getUser(guildId, userId).then( (t) => { return t.ts } );
  const formerTime = dayjs(formerRaw);
  if ((now > formerTime.add(15,'hours') && now < formerTime.endOf('day').add(1, 'day'))) {
    return 1;
  } else if (now > formerTime.endOf('day').add(1, 'day')) {
    return -1;
  } else {
    return 0;
  }
}

discord.on('messageCreate', async m => {
  if (!m.author.bot && m.channel.id == '893359071728652308') {

    const config = await getConfig(m.guild.id).then( (c) => { 
      if (c == undefined) { return 0 }
      else { return c }
    });

    const userId = m.author.id;
    const guildId = m.guildId;
    const username = `${m.author.username}#${m.author.discriminator}`;

    if (m.content.indexOf('!gm setup') == 0) {
      if (m.channel.permissionsFor(m.author).has(Permissions.FLAGS.ADMINISTRATOR)) {
        var keyword = m.content.split('!gm setup')[1].trim();
        if (keyword == '') { keyword = 'gm'; }
        insertGuild(guildId, m.guild.name, m.channel.name, m.channel.id, keyword)
        m.reply(`Setup to track ${keyword} in ${m.channel.name}`);
      } else { 
        m.reply('Must be admin to perform setup!');
      }

    } else if (m.content.toLowerCase() == config.keyword && config.channelId == m.channel.id) {
      const now = dayjs().valueOf();
      if (await getUser(guildId, userId) == null) {
        await initUser(guildId, userId, username).then(
          await incrUserStreak(guildId, userId, now)).then(
          m.react('1️⃣'));
      } else {
        const check = await checkTime(guildId, userId, now);
        if (check == 1) {
          await incrUserStreak(guildId, userId, now).then( () => {
            m.react('✅');
          });
        } else if (check == -1) {
          await clearUserStreak(userId, now).then(await incrUserStreak(userId, now));
        }
      }

      // !commands
    } else if (m.content == '!gm') {
      if (config == 0) { 
        return m.reply('Do setup with\n```!gm setup```');
      } else {
        const now = dayjs().valueOf();
        const check = await checkTime(guildId, userId, now).catch( () => 0);
        if (check == -1) clearUserStreak(guildId, userId, now);
        const streak = await getUser(guildId, userId).then( (d) => {
          if (d == null) { return 0 }
          else { return d.streak; } 
        });
        m.reply(`gm ${username}, you have a streak of ${streak}.`);
      }

    } else if (m.content == '!gm rank') {
      if (config == 0) { 
        return m.reply('Do setup with\n```!gm setup```')
      } else {
        const rank = await getRank();
        (rank[0] == undefined || rank[0][1] == '0') ? rank[0] = (['no one', 'NA']) : null;
        (rank[1] == undefined || rank[1][1] == '0') ? rank[1] = (['no one', 'NA']) : null;
        (rank[2] == undefined || rank[2][1] == '0') ? rank[2] = (['no one', 'NA']) : null;
        m.reply(`🥇 ${rank[0][0]} -> ${rank[0][1]}\n🥈 ${rank[1][0]} -> ${rank[1][1]}\n🥉 ${rank[2][0]} -> ${rank[2][1]}\n`);
      }
    } else if (m.content == '!gm help') {
        m.reply(`${config.keyword}\nSay ${config.keyword} to your frens once a day! Miss a day and your streak gets reset :(\nCheck your streak with \`!gm\`\nCheck the top ${config.keyword}'ers with \`!gm rank\`\nLet the ${config.keyword}'ing begin!`);
    }
  }
});

discord.once('ready', async c => {
  log(`Ready! Logged in as ${c.user.tag}`);
});

discord.login(keys.DISCORD_KEY);
await mongoConnect().then( () => {
  log('MongoDB connected');
});
