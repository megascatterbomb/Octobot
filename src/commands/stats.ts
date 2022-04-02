import {
    Alias,
    Inhibit,
    Argument,
    IntegerType,
    Client,
    Described,
} from "@frasermcc/overcord";
import { EmbedFieldData, GuildMember, Message, MessageEmbed, User } from "discord.js";
import { nextTick } from "process";
import { client } from "..";
import { Balance, getAllBalances } from "../database/octobuckBalance";
import ChannelCommand from "../extensions/channelCommand";
import { getDiscordNameFromID } from "../utilities/helpers";

const totalUSDInvested = 200;

@Alias("stats")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Get stats about the Octobuck economy.")
export default class StatsCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        const balances: Balance[] = await getAllBalances(-1);

        const totalOctobucks = balances.reduce((accumulator, object) => {
            return accumulator + object.balance;
        }, 0);
        const rateOctoToUSD = totalOctobucks/totalUSDInvested;
        const rateUSDToOcto = totalUSDInvested/totalOctobucks;

        message.channel.send("```\nTotal Octobucks: $" + totalOctobucks + "\nTotal USD Invested: $" + 
            totalUSDInvested + "\n1 USD = " + rateUSDToOcto.toPrecision(5) + " Octobucks\n1 Octobuck = " + rateOctoToUSD.toPrecision(5) + " USD```");
    }
}