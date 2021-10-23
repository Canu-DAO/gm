## Installation

install all npm modules:

```
npm install
```

rename `blank.env` to `.env` and edit accordingly

```
DISCORD_KEY=""
MONGO_USER_PASSWORD=""
```

## Usage
```
npm start
```

Add bot to your Discord server using the invite link below:

https://discord.com/api/oauth2/authorize?client_id=893356893865644083&permissions=3136&scope=bot

As the admin of the server navigate to the channel where you want words to be tracked and send
```
!gm setup
```

To track a custom word send
```
!gm setup customword
```

Send `!gm help` for more information

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.