import { ApplicationCommandType, Client, UserApplicationCommandData, UserContextMenuCommandInteraction } from "discord.js";

/**
 * Represents a User Context Menu Command that can be executed
 */
export interface KCUserCommand extends UserApplicationCommandData {
    type: ApplicationCommandType.User,
    run: KCUCommandExecute
}

/**
 * The execution function for a User Context Menu Command
 */
export type KCUCommandExecute = (
    /** The client who owns this command (or the 'bot') */
    client: Client,

    /** The interaction of the User Context Menu Command */
    interaction: UserContextMenuCommandInteraction
) => Promise<any>