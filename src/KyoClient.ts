import { ApplicationCommandDataResolvable, Client, ClientEvents, ClientOptions, Collection, Events, Interaction } from "discord.js";
import { PathLike } from 'fs';
import { KyoCommand, KyoCommandOptions } from "./structure/KyoCommand";
import { KyoEvent } from "./structure/KyoEvent";
import { readdir } from "fs/promises";
import { System } from "./utils/System";
import path from "path";

export interface KyoClientPaths {
    commands?: PathLike,
    events?: PathLike
}

export type KyoClientOptions = ClientOptions & KyoClientPaths;

export class KyoClient extends Client {

    /**
     * Fetches all files within a directory that match '*.ts', includes sub-folders
     * @param filePath the path to begin searching
     * @returns all files within a specific folder, recursively
     */
    private static async fetchFiles(filePath: PathLike): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            const files: Array<string> = [];

            await readdir(filePath, { withFileTypes: true }).then(async (dirents) => {
                for (const dirent of dirents) {
                    const resolved = path.resolve(String(filePath), dirent.name);
                    if (dirent.isDirectory()) {
                        await KyoClient.fetchFiles(resolved).then((fetchedFiles) => {
                            files.push(...fetchedFiles);
                        });
                    } else if (dirent.isFile()) {
                        files.push(resolved);
                    } else {
                        System.warn(`[fetchFiles] 'dirent' is not a file or directory: ${dirent.name}`);
                    }
                }
            }).catch(reject);

            resolve(files);
        });
    }

    private _paths: KyoClientPaths;

    private _commands: Collection<string, KyoCommand<KyoCommandOptions>>;
    private _events: Collection<keyof ClientEvents, Array<KyoEvent<keyof ClientEvents>>>;

    constructor(options: KyoClientOptions) {
        super(options);

        this._paths = {
            commands: options.commands,
            events: options.events
        };

        this._commands = new Collection();
        this._events = new Collection();
    }

    public get paths() { return this._paths; }
    public get commands() { return this._commands; }
    public get events() { return this._events; }

    /**
     * Initializes everything to prepare for login.
     * Additionally, registers all gathered events after population and registers the command handler.
     * 
     * ### It is recommended to use this method.
     * If you do not use this method, you will have to fetch and push everything manually using {@link KyoClient.gatherEvents()}, {@link KyoClient.gatherCommands()}, and {@link KyoClient.pushCommands()}
     */
    public async initialize() {
        await this.gatherEvents();
        await this.gatherCommands();

        this.events.forEach((v, k) => v.forEach((e) => {
            this.on(k, (...args) => e.execute(this, ...args));
        }));

        this.on(Events.InteractionCreate, this.handleIncomingCommand);
    }

    /**
     * Populates the events collection from the files within a specific directory, or if not specified, the events path given during construction
     * @param filePath the events path
     * @throws if a) no path was specified from either sources; b) an error occured during gathering
     */
    public async gatherEvents(filePath?: PathLike): Promise<void> {
        if (filePath === undefined) filePath = this._paths.events;
        if (filePath === undefined) throw new Error("No path specified for Events population");

        await KyoClient.fetchFiles(filePath).then(async (files) => {
            for (const file of files) {
                const event = (await require(file))?.default as KyoEvent<keyof ClientEvents>;
                if (!event || !event.event || !event.execute) continue;

                this._events?.set(event.event, Array.from(this._events.get(event.event) || []).concat(event));
            }
        }).catch((reason) => {
            System.error(`Failed to gather events from directory ${filePath}: ${reason}`);
            System.error(reason);
            throw new Error(reason);
        });
    }

    /**
     * Populates the commands collection from the files within a specific directory, or if not specified, the commands path given during construction
     * @param filePath the commands path
     * @throws if a) no path was specified from either sources; b) an error occured during gathering
     */
    public async gatherCommands(filePath?: PathLike): Promise<void> {
        if (filePath === undefined) filePath = this._paths.commands;
        if (filePath === undefined) throw new Error("No path specified for Commands population");

        await KyoClient.fetchFiles(filePath).then(async (files) => {
            for (const file of files) {
                const command = (await require(file))?.default as KyoCommand<KyoCommandOptions>;
                if (!command || !command.rawData) continue;

                this._commands.set(command.rawData.name, command);
            }
        }).catch((reason) => {
            System.error(`Failed to gather commands from directory ${filePath}: ${reason}`);
            throw new Error(reason);
        });
    }

    /**
     * Pushes all populated commands to Discord to ensure all commands are registered
     * @param commands the list of commands that we should register to discord
     */
    private async pushCommands(commands: Array<ApplicationCommandDataResolvable>) {
        if (!this.commands) throw new Error("Commands have not been initialized");

        System.debug("[KyoClient] Pushing registered commands to Discord...");
        try {
            await this.application?.commands.set(commands);
            System.debug("[KyoClient] Successfully pushed commands to Discord!");
        } catch (error) {
            System.error(`[KyoClient] Failed to push commands to Discord: ${error}`);
            throw new Error(`Failed to push commands to Discord: ${error}`);
        }
    }

    public override login(token?: string): Promise<string> {
        this.once(Events.ClientReady, async () => {
            await this.pushCommands(Array.from(this.commands.values()).map((opt) => opt.rawData));
            System.debug("[KyoClient] Client responded with \"Ready\" event!");
        });

        return super.login(token);
    }

    /**
     * Handles an incoming request for any commands to execute their specific command.
     * 
     * Override this function if you seek different functionality. Only do this if you know what you are doing.
     * @param interaction the interaction
     */
    public async handleIncomingCommand(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const filtered = this.commands.filter((opt) => opt.rawData.type === interaction.commandType);
        const command = filtered.find((opt) => opt.rawData.name === interaction.commandName);
        if (command === undefined) {
            System.warn(`[Commands] Failed to find ${interaction.commandName} despite being registered with Discord.`);
            return;
        }

        try {
            switch (true) {
                case command.isChatCommand() && interaction.isChatInputCommand():
                    await command.rawData.run(this, interaction);
                    break;
                case command.isUserCommand() && interaction.isUserContextMenuCommand():
                    await command.rawData.run(this, interaction);
                    break;
                case command.isMessageCommand() && interaction.isMessageContextMenuCommand():
                    await command.rawData.run(this, interaction);
                    break;
            }

            System.info(`[Commands] Command ${interaction.commandName} resulted in SUCCESS`);
        } catch (error) {
            System.warn(`[Commands] Command ${interaction.commandName} resulted in ERROR: ${error}`);
            System.warn(error);
        }
    }
}