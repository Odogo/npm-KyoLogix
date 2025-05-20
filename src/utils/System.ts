/**
 * A level for logging messages into console, displays the color and the level within the message
 */
export class LogLevel {
    color: string;
    name: string;

    /**
     * Creates a new level for logging
     * @param color the color for the message
     * @param name the name that should display within console (i.e. "INFO", "WARN")
     */
    constructor(color: string, name: string) {
        this.color = color;
        this.name = name;
    }

    static readonly ERROR = new LogLevel("\x1b[31m", "ERROR");
    static readonly INFO = new LogLevel("\x1b[32m", "INFO");
    static readonly WARN = new LogLevel("\x1b[33m", "WARN");
    static readonly DEBUG = new LogLevel("\x1b[34m", "DEBUG");
}

/**
 * A lovely utility that sends pretty logging messages into console
 */
export class System {
    /**
     * Sends a logging message into the console
     * @param level the level of this message
     * @param printable the message or object to print
     */
    public static log(level: LogLevel, printable: any): void {
        if (level === LogLevel.DEBUG)
            if (process.env.logging_debug === "false") return;

        let dateFormat = new Date().toLocaleString('en-us', { timeZone: process.env.logging_timezone || 'Utc', timeStyle: 'medium', dateStyle: 'short' });
        console.log(level.color + " [" + dateFormat + "] [" + level.name.toUpperCase() + "]", printable);
    }

    /**
     * Executes {@link System.log()} with the provided message at the "INFO" level
     * @param printable the message or object to print
     */
    public static info(printable: any) { System.log(LogLevel.INFO, printable); }

    /**
     * Executes {@link System.log()} with the provided message at the "WARN" level
     * @param printable the message or object to print
     */
    public static warn(printable: any) { System.log(LogLevel.WARN, printable); }

    /**
     * Executes {@link System.log()} with the provided message at the "ERROR" level
     * @param printable the message or object to print
     */
    public static error(printable: any) { System.log(LogLevel.ERROR, printable); }

    /**
     * Executes {@link System.log()} with the provided message at the "DEBUG" level
     * @param printable the message or object to print
     */
    public static debug(printable: any) { System.log(LogLevel.DEBUG, printable); }
}