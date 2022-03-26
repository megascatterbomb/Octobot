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

@Alias("ping", "hello", "test")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Test if the bot is alive")
export default class PingCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        console.log("Ping received from " + message.author.username + " " + message.author.id); 
        message.channel.send("Pong!");
    }
}