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
import { getCounterValue } from "../../events/randomDrops";

@Alias("counter")
@Permit("ADMINISTRATOR")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
export default class CounterCommand extends Command {

    async execute(message: Message, client: Client) {
        message.reply("" + getCounterValue());
    }
}