# KyoLogix

A helpful package that resolves around making Discord bots easier.

## Installation

To install this package, simply install this package.

```shell
npm install kyologix
```

## Creating a Client

Creating a client is as simple as replacing your original `Client` from discord.js with a `KyoClient` provided within the package. Nothing else should change with the functionality of your current bot. *(If it does, please create an issue report!)*

However, if you'd like to use this package's features to it's fullest extent, you can continue onto registration of events
and commands. There are two ways to handle this, one is automatically, the other is manually.

### Automatic Registration

Instead of designing a system to fetch all of the files in commands and events, this package includes those methods built-in.

> [!IMPORTANT]
> This package does not read any file outside of the given path shown below. If it does, please report it immediately as it
> will be addressed with the highest priority as a security vulnerability.
>
> Additionally, this package will only read JavaScript and TypeScript files as necessary and nothing further. Any file that
> does not meet the data format is silently rejected.
>
> If you do not feel comfortable with a built-in reader, please see the next section regarding manual registration.

During the construction of the client, provide paths to both your commands and events folder, as applicable. Sub-folders within the given
path will be recursively read to fetch all files within. Below is an example of this:

```typescript
// src/index.ts
const commandsPath = join(__dirname, "cmds");
const eventsPath   = join(__dirname, "events");

const client = new KyoClient({
  intents: [], // replace with your intents
  commands: commandsPath,
  events: eventsPath,
});
```

Afterwards, you will need to initialize the client using the `client.initialize()` method. This will automatically gather the commands and events. All events
will be registered to the `EventEmitter` within the client automatically. Commands will be pushed when the bot logs in and is ready.

### Manual Registration

Within the client, there is two methods to facilitate manual registration:

```typescript
const client = new KyoClient({ ... });

client.addEvent(event); // supply event
client.addCommand(command); // supply command
```

Events registered using the method above will automatically begin listening to the EventEmitter. Commands are staged until the next push, which
happens during login and a Ready signal, or manually using `#pushCommands()`.

## Creating Events

Events are what Discord.js listens to within guilds (servers) or other sources that things may appear from.
There are a *lot* of events that you can listen to. A [list of all events can be found here!](https://discord.js.org/docs/packages/discord.js/main/Events:Enum)

To create an event, you'll need to specify which event you'll be listening to and *how* we're listening to it. To do this, use `KyoEvent.create(...)` and `export default`
the method.

Below are the fields that the `#create(...)` method will accept.

| Field | Required | Description | Type |
| --- | --- | --- | --- |
| `type` | ✓ | How the event is listening, whether we should fire the event once, or for all instances this occurs | `ExecutionType` |
| `event` | ✓ | The specific Discord.js event to listen for | `Events` |
| `run` | ✓ | An async function accepting any event parameters to execute logic on when the event is fired | `(...) => Promise<any>`[^1] |

[^1]: The function's arguments depend on what event we're listening to. Refer to documentation pertaining to that event.

Below is an example using the `InteractionCreate` event:

```typescript
// events/InteractionCreate.ts
export default KyoEvent.create({
    type: ExecutionType.Forever // registers the event listener as with ".on()"
    event: Events.InteractionCreate

    run: async (interaction) => {
        // event logic here
    }
});
```

## Creating Commands

Creating a command reqires a little bit more effort compared to Events does.

For some background context, there are three (3) different types of commands possible within Discord. They are `ChatInput`, `Message`, and `User`. Both `Message` and `User` are related
to their respective context menus when you right click on that specific object, and `ChatInput` is your standard slash command.

To create a command, you'll need to call the `KyoCommand.create()` method and supply a type to start with. This type is extremely important to determine what your command actually functions as.

Below is a table of the typical requirements and optional fields of a command, however there are several other fields that aren't listed and/or require a specific type. Please check the footnotes within the table (if present) on anything to avoid confusion!

| Field | Required | Description | Type |
| --- | --- | --- | --- |
| `name` | ✓ | The name of the command | `string` |
| `type` | ✓ | The type of the command | `ApplicationCommandType`[^2] |
| `description` | ✓[^4] | A description for a `ChatInput` command | `string` |
| `run` | ✓ | The execution logic for the command | `(client, interaction) => Promise<any>`[^3] |
| `contexts` | X | Where this command can be executed, i.e. in a guild, the user's DMs with the bot, etc. | `InteractionContextType[]` |
| `nsfw` | X | Whether this command should be age-restricted | `boolean` |
| `options` | X | The options for the event when executed, used to supply arguments for commands. [^4] | `ApplicationCommandOptionData[]` |
| ... | ... | See [Discord's documentation for additional fields](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure) | ... |

[^2]: `PrimaryEntryPoint` is not accepted here.
[^3]: The `interaction` field does change depending on which command `type` is selected. IntelliSense should update accordingly when hovering over the `interaction` argument when making the function. You do not have to make sure the interaction is the given interaction via `#isChatInputCommand()`, for example.
[^4]: Requires the `ChatInput` type.

Below are four examples on how to use this system and how they are used:

```typescript
// a ChatInput command with no options
export default KyoCommand.create({
    type: ApplicationCommandType.ChatInput,
    name: "helloworld",
    description: "Says Hello to the Wonderful world!",

    run: async (client, interaction) => {
        await interaction.reply("Hello world!");
    }
});
```

```typescript
// a ChatInput command with options
export default KyoCommand.create({
    type: ApplicationCommandType.ChatInput,
    name: "bonk",
    description: "Bonk a user!",

    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: "user",
            description: "The user to bonk",
            required: true
        }
    ],

    run: async (client, interaction) => {
        const target = interaction.options.getUser("target", true);

        await target.send("Bonk!");
        await interaction.reply("The user was bonked!");
    },
});
```

```typescript
// a User command
export default KyoCommand.create({
    name: "id",
    type: ApplicationCommandType.User

    run: async (client, interaction) => {
        const target = interaction.targetUser;

        await interaction.reply("That user's ID is `" + target.id + "`");
    },
});
```

```typescript
// a Message command
export default KyoCommand.create({
    name: "channel",
    type: ApplicationCommandType.Message

    run: async (client, interaction) => {
        const target = interaction.targetMessage;

        await interaction.reply("This message was posted in <#" + target.channel.id + ">");
    },
});
```

## Extra Utilities

An additional utility that comes along with this package is the `System` class. This is just a fancy wrapper over
console.log to include a timestamp, log levels, and colors it within a terminal.

You can create your own log levels, if you would like. By default there's `INFO`, `WARN`, `ERROR`, and `DEBUG`.

```typescript
System.info("message");

System.warn("message");

System.error("message");

System.debug("message");
```

By default, no `DEBUG` messages will be printed and the timezone will be set to `UTC`. To change this, use `System.configurate()` to modify how the System module behaves and formats the
system messages.
