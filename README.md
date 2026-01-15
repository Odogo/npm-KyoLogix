# KyoLogix

A helpful package that resolves around making Discord bots easier.

## Getting Started

### Installation

To install this package, simply install this package. No further setup is required!

### Creating a Client

Instead of using Discord.js's Client object, use the `KyoClient` class to create your client.
The options when creating a client are almost identical to creating a normal client, except you can specify a path to both your events and commands.

Here's an example:

```typescript
const client = new KyoClient({
    intents: [], // replace with your intents
    commands: './commands',
    events: './events',
});
```

> [!NOTE]
> A more robust solution would be to use the `path` package to create constant variables for your paths. Instead of the above example, it would look more like this:
>
> ```typescript
> // src/index.ts
> const commandsPath = join(__dirname, "cmds");
> const eventsPath   = join(__dirname, "events");
>
> const client = new KyoClient({
>    intents: [], // replace with your intents
>    commands: commandsPath,
>    events: eventsPath,
> });
> ```

Once you have your client, you'll need to initialize it using the `initialize()` function. This will gather all of your commands and events, register your events to the client's listener, and handle the incoming command interactions as well.

> [!WARNING]
> It is best to use this functionality instead of implementing your own initialization. While it *is* supported to do so,
> all of registration must be handled accordingly otherwise things have a high likelyhood of going wrong.
>
> If you are insistent, it is recommended to override the `initialize()` function, handle your initialization, and then call
> the base function with `super.initialize()`.

Technically, that's the setup completed! If you wanted to handle everything else yourself you can! However, this
package isn't just a simple wrapper around the client class.

### Events

Events are what Discord.js listens to within guilds (servers) or other sources that things may appear from. 
There are a *lot* of events that you can listen to. A [list of all events can be found here!](https://discord.js.org/docs/packages/discord.js/main/Events:Enum)

To create an event, you'll need to specify which event you'll be listening to and *how* we're listening to it. To do this, use `KyoEvent.create(...)` and `export default`
the method.

Below are the fields that the `#create(...)` method will accept.
| Field | Required | Description |
| --- | --- | --- |
| `type` | ✓ | How the event is listening, whether we should fire the event once, or for all instances this occurs |
| `event` | ✓ | The specific Discord.js event to listen for |
| `run` | ✓ | An async function accepting any event parameters to execute logic on when the event is fired |

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

### Commands

Creating a command reqires a little bit more effort compared to Events does.

For some background context, there are three (3) different types of commands possible within Discord. They are `ChatInput`, `Message`, and `User`. Both `Message` and `User` are related
to their respective context menus when you right click on that specific object, and `ChatInput` is your standard slash command.

To create a command, you'll need to call the `KyoCommand.create()` method and supply a type to start with. This type is extremely important to determine what your command actually functions as.

Below is a table of the typical requirements and optional fields of a command, however there are several other fields that aren't listed and/or require a specific type. Please check the footnotes within the table (if present) on anything to avoid confusion!
| Field | Required | Description | Type |
| --- | --- | --- | --- |
| `name`        | ✓ | The name of the command | `string`
| `type`        | ✓ | The type of the command | `ApplicationCommandType`[^1]
| `description` | ✓ | A description for the commnad | `string`
| `run`         | ✓ | The execution logic for the command | `(client, interaction) => Promise<any>`[^2]
| `contexts`    | X | Where this command can be executed, i.e. in a guild, the user's DMs with the bot, etc. | `InteractionContextType[]`
| `nsfw`        | X | Whether this command should be age-restricted | `boolean`
| `options`     | X | The options for the event when executed, used to supply arguments for commands. [^3] | `ApplicationCommandOptionData[]`
| ...           | ... | See [Discord's documentation for additional fields](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure) | ...

[^1]: `PrimaryEntryPoint` is not accepted here.
[^2]: The `interaction` field does change depending on which command `type` is selected. IntelliSense should update accordingly when hovering over the `interaction` argument when making the function. You do not have to make sure the interaction is the given interaction via `#isChatInputCommand()`, for example.
[^3]: Requires the `ChatInput` type.

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
    type: ApplicationCommandType.User,
    description: "Get the target's user ID",

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
    type: ApplicationCommandType.Message,
    description: "Get the target message's channel",

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
