import { Client, Intents, Permissions } from 'discord.js';
import dayjs from 'dayjs';
import { keys } from './keys.js';
import { sleep, log } from './utils.js';
import { mongoConnect, insertGuild, getConfig, initUser, getUser, getRank, incrUserStreak, clearUserStreak } from './mongo.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

const nummoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

async function checkTime(userId, now) {
  const formerRaw = await getUser(userId).then( (t) => { return t.ts } );
  const formerTime = dayjs(formerRaw);
  if ((now >= formerTime.add(15,'hours') && now <= formerTime.endOf('day').add(1, 'day'))) {
    return 1;
  } else if (now > formerTime.endOf('day').add(1, 'day')) {
    return -1;
  } else {
    return 0;
  }
}

async function handleUser (userId, username) {
  const now = dayjs().valueOf();
  if (await getUser(userId) == null) {
    await initUser(userId, username).then(
      await incrUserStreak(userId, now));
      return 1;
  } else {
    const check = await checkTime(userId, now);
    if (check == 1) {
      await incrUserStreak(userId, now);
      return 1;
    } else if (check == -1) {
      await clearUserStreak(userId).then(await incrUserStreak(userId, now));
      return -1;
    } else {
      return 0;
    }
  }
}

function numToEmoji (num) {
  var emoji = [];
  const numString = num.toString();
  const numArray = numString.split('');
  for (var i = 0; i < numArray.length; i++) {
    emoji.push(
      nummoji[numArray[i]]
    );
  }
  return emoji;
}

discord.on('messageCreate', async m => {
  if (!m.author.bot) {

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
        insertGuild(m.guild.name, m.channel.name, m.channel.id, keyword)
        m.reply(`Setup to track ${keyword} in ${m.channel.name}`);
      } else { 
        m.reply('Must be admin to perform setup!');
      }

    } else if (m.content.toLowerCase() == config.keyword && config.channelId == m.channel.id) {
      await handleUser(userId, username).then( (r) => {
        if (r === 0) {
          m.react('⏰');
        } else {
          getUser(userId).then( (u) => { 
            const streakmoji = numToEmoji(u.streak); 
            for (var i = 0; i < streakmoji.length; i++){
              m.react(streakmoji[i]);
            }
          });
        }
      });

    } else if (m.content == '!gm') {
      if (config == 0) { 
        return m.reply('Do setup with\n```!gm setup```');
      } else {
        const now = dayjs().valueOf();
        const check = await checkTime(userId, now).catch( () => 0);
        if (check == -1) clearUserStreak(userId, now);
        const user = await getUser(userId).then( (u) => {
          if (u == null) { return 0 }
          else { return u; } 
        });
        m.reply(`gm ${username}, you have a streak of ${user.streak} and overall have said ${config.keyword} ${user.history.length} times`);
      }

    } else if (m.content === '!gm avg') {
      const avg = await getUser(userId).then( (t) => { 
        const history = t.history;
        const length = history.length;
        let ret = 0;
        history.forEach(h => {
          const i = dayjs(parseInt(h)).format('HH');
          ret = ret + parseInt(i);
        })
        return ret/length;
      });
      m.reply(`You usually say ${config.keyword} around ${Math.round(avg)}:00`);

    } else if (m.content == '!gm rank') {
      if (config == 0) { 
        return m.reply('Do setup with\n```!gm setup```')
      } else {
        const cutoff = dayjs().subtract(1,'day').valueOf();
        const rank = await getRank(cutoff);
        (rank[0] === undefined || rank[0].streak == 0) ? rank[0] = ({'username': 'no one', 'streak': 'NA'}) : null;
        (rank[1] === undefined || rank[1].streak == 0) ? rank[1] = ({'username': 'no one', 'streak': 'NA'}) : null;
        (rank[2] === undefined || rank[2].streak == 0) ? rank[2] = ({'username': 'no one', 'streak': 'NA'}) : null;
        (rank[3] === undefined || rank[3].streak == 0) ? rank[3] = ({'username': 'no one', 'streak': 'NA'}) : null;
        (rank[4] === undefined || rank[4].streak == 0) ? rank[4] = ({'username': 'no one', 'streak': 'NA'}) : null;
        m.reply(
          `🥇 ${rank[0].username} -> ${rank[0].streak}\n🥈 ${rank[1].username} -> ${rank[1].streak}\n🥉 ${rank[2].username} -> ${rank[2].streak}\n4️⃣ ${rank[3].username} -> ${rank[3].streak}\n5️⃣ ${rank[4].username} -> ${rank[4].streak}`);
      }

    } else if (m.content == '!gm wen') {
      const formerRaw = await getUser(userId).then( (t) => { return t.ts } );
      const formerTime = dayjs(formerRaw);
      const lower = formerTime.add(15,'hours');
      const upper = formerTime.endOf('day').add(1, 'day');
      m.reply(`You previously said ${config.keyword} at <t:${formerTime.unix()}>. Say it again after <t:${lower.unix()}> but before <t:${upper.unix()}>`);
    } else if (m.content == '!gm help') {
        m.reply(`${config.keyword}\nSay ${config.keyword} to your frens once a day! Miss a day and your streak gets reset :(\nI will respond to your ${config.keyword} with number emojis to let you know what your current streak is\nCheck your streak with \`!gm\`\nCheck the top ${config.keyword}'ers with \`!gm rank\`\nLet the ${config.keyword}'ing begin!`);
    }
  }
});

discord.once('ready', async c => {
  log(`Ready! Logged in as ${c.user.tag}`);
});

discord.login(keys.DISCORD_KEY);
await mongoConnect().then( (r) => {
  if (r === 1) { 
    log('MongoDB connected'); 
    return;
  } else {
    log('Error connecting.');
    process.exit();
  }
});
