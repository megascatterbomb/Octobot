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
import { getLotteryDrawTime, getLotteryJackpot, getLotteryPlayerCount } from "../database/lottery";
import ChannelCommand from "../extensions/channelCommand";

@Alias("lottery", "lot")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Test if the bot is alive")
export default class LotteryCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        message.reply(
            "```Next Draw: in " + ((((await getLotteryDrawTime()).getTime() - Date.now())/3600000).toPrecision(3)) + " hours\n" +
            "Total Players: " + (await getLotteryPlayerCount()) + "\n" +
            "Jackpot: " + (await getLotteryJackpot()) + "```"
        );
    }
}