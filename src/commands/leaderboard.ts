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

@Alias("leaderboard", "rich")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Test if the bot is alive")
export default class LeaderboardCommand extends ChannelCommand {
    @Argument({type: new IntegerType(), optional: true})
        page!: number;

    async execute(message: Message, client: Client) {
        if(this.page === undefined) {
            this.page = 1;
        } else if(this.page < 1) {
            throw new Error("You must specify a page number greater than or equal to 1.");
        }
        const embed: MessageEmbed = await generateRichEmbed(await getAllBalances(this.page), this.page, message);
        message.channel.send({embeds: [embed]});
    }
}

async function generateRichEmbed(balances: Balance[], page: number, message: Message): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Leaderboard")
        .setDescription("The richest people you can find!");

    // Need this to know how many spaces to use.
    const longestNameLength: number = Math.max(...await Promise.all(balances.map<Promise<number>>(async (e: Balance) => {
        return (await getDiscordNameFromID(e.user, message.client, message.guild)).length;
    })));

    let fieldValue = "```";
    for(const bal of balances){
        const name: string = await getDiscordNameFromID(bal.user, message.client, message?.guild); 
        const spacesCount = longestNameLength - name.length;
        const spaces: string = spacesCount > 0 ? " ".repeat(longestNameLength - name.length) : "";
        fieldValue += "\n" + name + " " + spaces + "$" + bal.balance;
    }
    fieldValue.trimEnd();
    fieldValue += " ```";

    embed.addField("Page " + page, fieldValue);
    return embed;
}