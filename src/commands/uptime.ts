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
import ChannelCommand from "../extensions/channelCommand";

@Alias("uptime")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Test if the bot is alive")
export default class UptimeCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        message.channel.send("Uptime: " + (process.uptime()/3600).toFixed(2) + " hours");
    }
}