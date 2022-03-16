import {
    Alias,
    Inhibit,
    Permit,
    Command,
    Argument,
    BooleanType,
    IntegerType,
    UnionType,
    FloatType,
    Client,
} from "@frasermcc/overcord";
import { Message } from "discord.js";

@Alias("ping", "hello", "test")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
export default class PingCommand extends Command {

    async execute(message: Message, client: Client) {
        message.channel.send("Pong!");
    }
}