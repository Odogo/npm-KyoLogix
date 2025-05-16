import { ApplicationCommandType, Client, MessageApplicationCommandData, MessageContextMenuCommandInteraction } from "discord.js";

/**
 * Represents a Message Context Menu Command that can be executed
 */
export interface KCMessageCommand extends MessageApplicationCommandData {
    type: ApplicationCommandType.Message,
    run: KCMCommandExecute
}

/**
 * The execution function for a Message Context Menu Command
 */
export type KCMCommandExecute = (
    /** The client who owns this command (or the 'bot') */
    client: Client,

    /** The interaction of the Message Context Menu Command */
    interaction: MessageContextMenuCommandInteraction
) => Promise<any>