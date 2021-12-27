import { Client, Intents, Permissions, MessageEmbed } from 'discord.js';
import dayjs from 'dayjs';
import { keys } from './keys.js';
import { sleep, log } from './utils.js';
import { mongoConnect, insertGuild, getConfig, initUser, getUser, getRank, incrUserStreak, clearUserStreak, zeroUserStreak } from './mongo.js';

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

const nummoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

const commands = ['!gm', '!gm wen', '!gm rank'];

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
  if (await getUser(userId) === null) {
    return await initUser(userId, username, now).then( () => {
      return 1;
    });
  } else {
    const check = await checkTime(userId, now);
    if (check === 1) {
      return await incrUserStreak(userId, now).then( (user) => {
        return user.streak;
      });
    } else if (check === -1) {
      return await clearUserStreak(userId, now).then( () => {
        return -1;
      });
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
    const botHasPermish = m.channel.permissionsFor(m.guild.me).has(Permissions.FLAGS.READ_MESSAGE_HISTORY);
    const config = await getConfig(m.guild.id).then( (c) => { 
      if (c == undefined) { return 0 }
      else { return c }
    });

    const userId = m.author.id;
    const username = m.author.tag;

    if (m.content.indexOf('!gm setup') === 0) {
      if (m.channel.permissionsFor(m.author).has(Permissions.FLAGS.ADMINISTRATOR)) {
        var keyword = m.content.split('!gm setup')[1].trim();
        if (keyword === '') { keyword = 'gm'; }
        insertGuild(m.guild.name, m.channel.name, m.channel.id, keyword)
        discord.channels.cache.get(m.channelId).send(`Setup to track ${keyword} in ${m.channel.name}`);
      } else { 
        discord.channels.cache.get(m.channelId).send('Must be admin to perform setup!');
      }

    } else if (m.content === '!gm help') {
      const message = new MessageEmbed()
        .setTitle('👋')
        .setDescription(`thanks for adding me!\nmy purpose is to count your gm's\nsay gm once a day to increment your streak\nmiss a day and your streak gets reset :(\nwhen you have successfully gm'ed you'll see reaction emojis with your current streak\nif you haven't waited long enough since your last gm you'll see a ⏰ reaction`)
        .addField('other commands',"`!gm` responds with your current streak and running total\n`!gm wen` responds with wen you last said it and wen to say it next\n`!gm rank` displays the current streak leader board\n`!gm setup` setups me up to track in the channel where it is sent\n")
        .addField('===========================','gm')
        .addField('brought to you by', '[CanuDAO](https://discord.gg/dv7SXUaMKD)');
      discord.channels.cache.get(m.channelId).send({embeds:[message]});
    
    } else if (config !== 0) {
        if (m.content.toLowerCase() === config.keyword && config.channelId === m.channel.id) {
          await handleUser(userId, username).then( (streak) => {
            try {
              if (streak === 0) {
                if (botHasPermish){
                  m.react('⏰');
                } else {
                  discord.channels.cache.get(m.channelId).send("Missing permissions to react to message");
                }
              } else {
                const streakmoji = numToEmoji(streak); 
                for (var i = 0; i < streakmoji.length; i++){
                  if (botHasPermish){
                    m.react(streakmoji[i]);
                  } else {
                    discord.channels.cache.get(m.channelId).send("Missing permissions to react to message");
                  }
                }
              }
            } catch(e) {
              log(`issue in ${m.guild.name}, ${m.channel.name}, ${username}`);
              log(e);
            }
          });

        } else if (m.content === '!gm') {
          const now = dayjs().valueOf();
          const check = await checkTime(userId, now).catch( () => 0);
          if (check === -1) zeroUserStreak(userId);
          const user = await getUser(userId).then( (u) => {
            if (u === null) { return 0 }
            else { return u; } 
          });
          if (user === 0) {
            discord.channels.cache.get(m.channelId).send(`gm ${m.author}, you've never said gm, give it a try!`);
          } else {
            discord.channels.cache.get(m.channelId).send(`gm ${m.author}, you have a streak of ${user.streak} and overall have said ${config.keyword} ${user.history.length} times`);
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
          discord.channels.cache.get(m.channelId).send(`You usually say ${config.keyword} around ${Math.round(avg)}:00`);

        } else if (m.content === '!gm rank') {
            const cutoff = dayjs().subtract(2,'day').valueOf();
            const rank = await getRank(cutoff);
            (rank[0] == undefined || rank[0].streak === 0) ? rank[0] = ({'username': 'no one', 'streak': 'NA'}) : null;
            (rank[1] == undefined || rank[1].streak === 0) ? rank[1] = ({'username': 'no one', 'streak': 'NA'}) : null;
            (rank[2] == undefined || rank[2].streak === 0) ? rank[2] = ({'username': 'no one', 'streak': 'NA'}) : null;
            (rank[3] == undefined || rank[3].streak === 0) ? rank[3] = ({'username': 'no one', 'streak': 'NA'}) : null;
            (rank[4] == undefined || rank[4].streak === 0) ? rank[4] = ({'username': 'no one', 'streak': 'NA'}) : null;
            discord.channels.cache.get(m.channelId).send(
              `🥇 ${rank[0].username} -> ${rank[0].streak}\n🥈 ${rank[1].username} -> ${rank[1].streak}\n🥉 ${rank[2].username} -> ${rank[2].streak}\n4️⃣ ${rank[3].username} -> ${rank[3].streak}\n5️⃣ ${rank[4].username} -> ${rank[4].streak}`);

        } else if (m.content === '!gm wen') {
          const formerRaw = await getUser(userId).then( (t) => { return t.ts } );
          const formerTime = dayjs(formerRaw);
          const lower = formerTime.add(15,'hours');
          const upper = formerTime.endOf('day').add(1, 'day');
          discord.channels.cache.get(m.channelId).send(`You previously said ${config.keyword} at <t:${formerTime.unix()}>. Say it again after <t:${lower.unix()}> but before <t:${upper.unix()}>`);
        }
    } else {
        if (commands.indexOf(m.content) > -1) {
          return discord.channels.cache.get(m.channelId).send('Do setup with\n```!gm setup```')
        }
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
