import { Client, Intents, Permissions } from 'discord.js';
import dayjs from 'dayjs';
import { keys } from './keys.js';
import { configJSONdb, loadJSONdb, getConfig, initUser, incrUserStreak, userExist, getUserStreak, getUserTime, getRank, clearUserStreak } from './db.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

function log(text) {
  console.log(`${new Date().toISOString()}\t${text}`);
}

async function checkTime(id, now) {
  const formerRaw = await getUserTime(id);
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
  if (!m.author.bot) {

    await loadJSONdb(m.guild.id);
    const config = await getConfig(m.guild.id).then( (c) => { 
      if (c == undefined) { return 0 }
      else { return c }
    });

    const id = m.author.id;
    const username = `${m.author.username}#${m.author.discriminator}`;

    if (m.content.indexOf('!gm setup') == 0) {
      if (m.channel.permissionsFor(m.author).has(Permissions.FLAGS.ADMINISTRATOR)) {
        var keyword = m.content.split('!gm setup')[1].trim();
        if (keyword == '') { keyword = 'gm'; }
        configJSONdb(m.guildId, m.guild.name, m.channel.name, m.channel.id, keyword)
        m.reply(`Setup to track ${keyword} in ${m.channel.name}`);
      } else { 
        m.reply('Must be admin to perform setup!');
      }

    } else if (m.content.toLowerCase() == config.keyword && config.channelId == m.channel.id) {
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
      if (config == 0) { 
        return m.reply('Do setup with\n```!gm setup');
      } else {
        const now = dayjs().valueOf();
        const check = await checkTime(id, now).catch( () => 0);
        if (check == -1) clearUserStreak(id);
        const streak = await getUserStreak(id).catch( () => 0 );
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
