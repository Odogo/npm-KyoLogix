import { Client, ClientEvents } from "discord.js";

export interface KyoEventOptions<EType extends keyof ClientEvents> {
    event: EType;
    type: ExecutionType;
    execute: KyoEventExecution<EType>
}

/**
 * A listener to any client Event from Discord
 */
export class KyoEvent<EType extends keyof ClientEvents> {
    
    public static create<T extends keyof ClientEvents>(options: KyoEventOptions<T>): KyoEvent<T> {
        return new KyoEvent(options);
    }

    private constructor(public readonly data: KyoEventOptions<EType>) { }

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

/**
 * Defines how many times an event should be executed.
 */
export enum ExecutionType {
    /** Event will be executed when first instance is fired, but will not be fired again. */
    OnlyOnce = "once",

    /** Event will be executed on every instance of the event type being fired. */
    Forever  = "on"
}