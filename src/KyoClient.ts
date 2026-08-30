import { ApplicationCommandDataResolvable, ApplicationCommandType, Client, ClientEvents, ClientOptions, Collection, Events, Interaction } from "discord.js";
import { Dirent, existsSync, PathLike } from 'fs';
import { KyoCommand, KyoCommandOptions } from "./structure/KyoCommand.js";
import { ExecutionType, KyoEvent } from "./structure/KyoEvent.js";
import { readdir } from "fs/promises";
import { System } from "./utils/System.js";
import path from "path";
import { pathToFileURL } from "url";

export interface KyoClientPaths {
	commands?: PathLike,
	events?: PathLike
}

export type KyoClientOptions = ClientOptions & KyoClientPaths;

type AnyKyoEvent = KyoEvent<any>;

export class KyoClient extends Client {
	
	/**
	* Fetches all files within a directory that match '*.ts', includes sub-folders
	* @param filePath the path to begin searching
	* @param extensions the file extensions to specifically look for
	* @returns all files within a specific folder, recursively
	*/
	public static async fetchFiles(filePath: PathLike, extensions?: string[] | undefined): Promise<string[]> {
		const files: Array<string> = [];
		
		if (!existsSync(filePath))
			return files;

		const dirents = await readdir(filePath, { withFileTypes: true });
		for (const dirent of dirents) {
			const resolved = path.resolve(String(filePath), dirent.name);

			if (dirent.isDirectory()) {
				const recursive = await KyoClient.fetchFiles(resolved, extensions);
				files.push(...recursive);

			} else if (dirent.isFile()) {
				// Ignore files that are not associated with the extensions
				if (extensions && !this.verifyFileExtension(dirent, extensions))
					continue;
				files.push(resolved);

			} else System.warn(`[fetchFiles] 'dirent' is not a file or directory: ${dirent.name}`);
		}
		
		return files;
	}
	
	private static verifyFileExtension(file: Dirent<string>, extensions: string[]): boolean {
		for(const ext of extensions) {
			if(file.name.endsWith(ext))
				return true;
		}
		return false;
	}
	
	private _paths: KyoClientPaths;
	
	private _commands: Collection<ApplicationCommandType, Collection<string, KyoCommand<KyoCommandOptions>>>;
	private _events: Collection<keyof ClientEvents, Array<AnyKyoEvent>>;
	
	private _initialized: boolean = false;
	
	constructor(options: KyoClientOptions) {
		super(options);
		
		this._paths = {
			commands: options.commands,
			events: options.events
		};

		if (!options.commands)
			System.debug("WARNING: By providing no path to commands, you will need to register them yourself manually. If there is an additional layer to gather commands, you can ignore this message.");
		if (!options.events)
			System.debug("WARNING: By providing no path to events, you will need to register them yourself manually. If there is an additional layer to gather events, you can ignore this message.");
		
		this._commands = new Collection();
		this._events = new Collection();
	}
	
	public get paths() { return this._paths; }
	public get rawCommands() { return this._commands; }
	public get commands() { return this._commands.map((val) => Array.from(val.values())).flat(); }
	public get events() { return this._events; }
	
	public get initialized() { return this._initialized; }
	
	/**
	* Initializes everything to prepare for login.
	* 
	* This will automatically collect all events and commands within the given paths, if applicable, upon creation. An error
	* will be thrown if this method is attempted without paths.
	* 
	* If re-initializing, all listeners, registered events, and commands are removed. You will have to re-push commands again if executed after logging in.
	* 
	* @throws if either path upon creation is NOT specified.
	*/
	public async initialize() {
		if (this._initialized) {
			this.removeAllListeners();

			this._commands.clear();
			this._events.clear();
		}
		
		this._initialized = true;

		await this.gatherEvents();
		await this.gatherCommands();

		this.registerCommandManager();
	}
	
	public override async destroy(): Promise<void> {
		super.destroy();
		this._initialized = false;
		return;
	}
	
	/**
	* Populates the events collection from the files within a specific directory, 
	* or if not specified, the events path given during construction
	* @param filePath the events path
	* @throws if a) no path was specified from either sources; b) an error occured during gathering
	*/
	public async gatherEvents(filePath?: PathLike): Promise<void> {
		if (filePath === undefined) filePath = this._paths.events;
		if (filePath === undefined) throw new Error("No path was specified to gather events with. Ensure you set one if you're using #initialize() or #gatherEvents()");

		const files = await KyoClient.fetchFiles(filePath, [".js", ".mjs", ".cjs", ".ts"]);
		for (const file of files) {
			try {
				const mod = await import(pathToFileURL(file).href);
				const event = mod?.default as KyoEvent<keyof ClientEvents>;

				this.addEvent(event);
			} catch (error) {
				System.warn(`Failed to interpret file ${file} into a KyoEvent object.`);
			}
		}
	}

	/**
	 * Validates and registers the events internally and within the EventEmitter attached to the client.
	 * @param event the event to validate and register
	 * @throws if the event (and its data) does not exist, or the event is missing required fields.
	 */
	public addEvent<EType extends keyof ClientEvents>(event: KyoEvent<EType>) {
		if (!event || !event.data)
			throw "Event data does not exist"
		if (!event.data.event || !event.data.run || !event.data.type)
			throw "Missing components of event body that is required";

		this._events.set(event.data.event, Array.from(this._events.get(event.data.event) || []).concat(event));

		if (event.data.type === ExecutionType.Forever)
			this.on(event.data.event, (...args) => event.data.run(this, ...args));
		else
			this.once(event.data.event, (...args) => event.data.run(this, ...args));
	}

	/**
	 * Registers the event hook to execute {@link handleIncomingCommand this.handleIncomingCommand()} when the `InteractionCreate` event is fired.
	 */
	public registerCommandManager() {
		this.on(Events.InteractionCreate, this.handleIncomingCommand);
	}
	
	/**
	* Populates the commands collection from the files within a specific directory,
	* or if not specified, the commands path given during construction
	* @param filePath the commands path
	* @throws if a) no path was specified from either sources; b) an error occured during gathering
	*/
	public async gatherCommands(filePath?: PathLike): Promise<void> {
		if (filePath === undefined) filePath = this._paths.commands;
		if (filePath === undefined) throw new Error("No path was specified to gather commands with. Ensure you set one if you're using #initialize() or #gatherCommands()");

		const files = await KyoClient.fetchFiles(filePath, [".js", ".mjs", ".cjs", ".ts"]);
		for (const file of files) {
			try {
				const mod = await import(pathToFileURL(file).href);
				const command = mod?.default as KyoCommand<KyoCommandOptions>;

				this.addCommand(command);
			} catch (error) {
				System.warn(`Failed to interpret file ${file} into a KyoCommand object.`);
			}
		}
	}

	public addCommand(command: KyoCommand<KyoCommandOptions>) {
		if (!command || !command.data)
			throw "Command data does not exist";
		if (!command.data.name || !command.data.type || !command.data.run)
			throw "Missing components of command body that is required";

		if (!this._commands.has(command.data.type))
			this._commands.set(command.data.type, new Collection());

		this._commands.get(command.data.type)?.set(command.data.name, command);
	}
	
	/**
	* Pushes all populated commands to Discord to ensure all commands are registered
	* @param commands the list of commands that we should register to discord
	*/
	public async pushCommands(commands: Array<ApplicationCommandDataResolvable>) {
		if (!this.commands)
			throw new Error("Commands have not been initialized");
		
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
			await this.pushCommands(this.commands.map((opt) => opt.data));
			
			System.debug("[KyoClient] Client responded with \"Ready\" event!");
		});
		
		return super.login(token);
	}
	
	/**
	* Handles an incoming request for any commands to execute their specific command.
	* 
	* You can override this method if you would like to handle commands differently, however it is recommended
	* to use the default handling, unless you know what you're doing.
	* @param interaction the interaction
	*/
	public async handleIncomingCommand(interaction: Interaction) {
		if (!interaction.isCommand()) return;
		
		const filtered = this.commands.filter((opt) => opt.data.type === interaction.commandType);
		const command = filtered.find((opt) => opt.data.name === interaction.commandName);
		if (command === undefined) {
			System.warn(`[Commands] Failed to find ${interaction.commandName} despite being registered with Discord.`);
			return;
		}
		
		try {
			switch (true) {
				case command.isChatCommand() && interaction.isChatInputCommand():
				await command.data.run(this, interaction);
				break;
				case command.isUserCommand() && interaction.isUserContextMenuCommand():
				await command.data.run(this, interaction);
				break;
				case command.isMessageCommand() && interaction.isMessageContextMenuCommand():
				await command.data.run(this, interaction);
				break;
			}
			
			System.info(`[Commands] Command ${interaction.commandName} resulted in SUCCESS`);
		} catch (error) {
			System.warn(`[Commands] Command ${interaction.commandName} resulted in ERROR: ${error}`);
			System.warn(error);
		}
	}
}