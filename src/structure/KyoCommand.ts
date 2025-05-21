import { ApplicationCommandType } from "discord.js";
import { KCChatInputCommand } from "./types/KCChatInputCommand";
import { KCMessageCommand } from "./types/KCMessageCommand";
import { KCUserCommand } from "./types/KCUserCommand";

/**
 * The different options a KyoCommand could possibly be
 */
export type KyoCommandOptions = KCChatInputCommand | KCMessageCommand | KCUserCommand;

/**
 * A KyoCommand is representative of any of Discord's possible commands, those being ChatInput, Message, and User.
 * 
 * This is designed to handle all possible commands, to create one use {@link KyoCommand.create()} to create one. The required `type` field determines which
 * of the options this command is.
 */
export class KyoCommand<Type extends KyoCommandOptions> {

    public static create<T extends KyoCommandOptions>(options: T): KyoCommand<T> & T {
        return new KyoCommand(options) as KyoCommand<T> & T;
    }

    private constructor(public readonly rawData: Type) { }

    public isChatCommand(): this is KyoCommand<KCChatInputCommand> {
        return this.rawData.type === ApplicationCommandType.ChatInput;
    }

    public isMessageCommand(): this is KyoCommand<KCMessageCommand> {
        return this.rawData.type === ApplicationCommandType.Message;
    }

    public isUserCommand(): this is KyoCommand<KCUserCommand> {
        return this.rawData.type === ApplicationCommandType.User;
    }
}