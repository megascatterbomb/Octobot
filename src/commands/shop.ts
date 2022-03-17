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
    Described,
} from "@frasermcc/overcord";
import { Message } from "discord.js";

@Alias("shop")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("View items available for purchase")
export default class PingCommand extends Command {

    async execute(message: Message, client: Client) {
        
    }
}