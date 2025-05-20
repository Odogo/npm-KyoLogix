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

To create a event, create a new file under the defined events folder within your project and export a default new `KyoEvent` object.

```typescript
// events/InteractionCreate.ts
export default new KyoEvent(Events.InteractionCreate, async (client, interaction) => {
    // logic here
});
```

The name of the file doesn't matter, it can be whatever you'd like it to be to help your file structure. Additionally, you can sort them further by dropping them into folders!

### Commands

To create a commands, create a new file under the defined commands folder within your project. Creating a command is different from how'd you expect it, due to the different variants of commands possible.

There are three different types of commands, there's `ChatInput`, `Message`, and `User`. Both `Message` and `User` are related
to their respective context menus when you right click on that specific object within Discord. `ChatInput` is your standard
slash command.

Within your newly created file, call the `KyoCommand.create()` method. You must define the type, name, and the `run` function. The rest is all descriptions and/or options for your command that is up to the command's function.

```typescript
// commands/ci_HelloWorld.ts (i like to prefix my commands with the type)
export default KyoCommand.create({
    type: ApplicationCommandType.ChatInput,
    name: "helloworld",
    description: "Says Hello to the Wonderful world!",

    run: async (client, interaction) => {
        return await interaction.reply("Hello world!");
    }
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

By default, `DEBUG` will not print to console. To enable `DEBUG` logging, you must have a .env file with `LOGGING_DEBUG` set to `true`. You can also change the timezone by modifying the `LOGGING_TIMEZONE` field, by default this is set to UTC.
