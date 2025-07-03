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

Events are what Discord.js listens to within guilds (servers) or other sources that things may appear from. There are a *lot* of events that you can listen to.

To create an event, under your already-defined events folder within your project, create a new file and `export default` a new `KyoEvent` class. The constructor will require the
specific event that you'll be listening to and a callback function for when the event is called.

You can have multiple files listening to the same event, if you like to sort things by modules or for your own reasons.

Below is an example of the `KyoEvent` class, listening on the `InteractionCreate` event:

```typescript
// events/InteractionCreate.ts
export default new KyoEvent(Events.InteractionCreate, async (client, interaction) => {
    // logic here
});
```

### Commands

Creating a command reqires a little bit more effort compared to Events does.

For some background context, there are three (3) different types of commands possible within Discord. They are `ChatInput`, `Message`, and `User`. Both `Message` and `User` are related
to their respective context menus when you right click on that specific object, and `ChatInput` is your standard slash command.

To create a command, you'll need to call the `KyoCommand.create()` method and supply a type to start with. This type is extremely important to determine what your command actually functions as.

Additionally, some common fields also must be supplied when creating a command, typically those are `name`, `run`, and sometimes `description`.

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

By default, no `DEBUG` messages will be printed and the timezone will be set to `UTC`. To change this, use `System.configurate()` to modify how the System module behaves and formats the
system messages.
