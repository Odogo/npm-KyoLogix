import { ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Client } from "discord.js";

/**
 * Represents a Chat Input Command that can be executed
 */
export interface KCChatInputCommand extends ChatInputApplicationCommandData {
    type: ApplicationCommandType.ChatInput,
    run: KCCICommandExecute
}

/**
 * The execution function for a Chat Input Command
 */
export type KCCICommandExecute = (
    /** The client who owns this command (or the 'bot') */
    client: Client,

    /** The interaction of the Chat Input Context Menu Command */
    interaction: ChatInputCommandInteraction
) => Promise<void>;