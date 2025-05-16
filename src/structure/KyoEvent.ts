import { Client, ClientEvents } from "discord.js";

/**
 * A listener to any client Event from Discord
 */
export class KyoEvent<EType extends keyof ClientEvents> {
    constructor(
        /** The event type to listen to */
        public event: EType,

        /** The execution of the event */
        public execute: KyoEventExecution<EType>
    ) { }
}

/**
 * The execution of an event within the Client, includes a reference to the client as well
 */
export type KyoEventExecution<EType extends keyof ClientEvents> = (
    /** The current client who was listening to the event */
    client: Client,

    /** The arguments of the specific event that is being listened to */
    ...args: ClientEvents[EType]
) => Promise<any>