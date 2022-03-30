import {
    Alias,
    Inhibit,
    Argument,
    IntegerType,
    Client,
    Described,
} from "@frasermcc/overcord";
import { EmbedFieldData, GuildMember, Message, MessageEmbed, User } from "discord.js";
import { Balance, getAllBalances } from "../database/octobuckBalance";
import ChannelCommand from "../extensions/channelCommand";
import { getDiscordName } from "../utilities/helpers";

@Alias("leaderboard", "rich")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Test if the bot is alive")
export default class LeaderboardCommand extends ChannelCommand {
    @Argument({type: new IntegerType(), optional: true})
        page!: number;

    async execute(message: Message, client: Client) {
        if(this.page === undefined) {
            this.page = 1;
        }
        const embed: MessageEmbed = await generateRichEmbed(await getAllBalances(this.page), this.page);
        message.channel.send({embeds: [embed]});
    }
}

async function generateRichEmbed(balances: Balance[], page: number): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Leaderboard")
        .setDescription("The richest people you can find!");
    
    let fieldValue = "";

    for(const bal of balances){
        fieldValue += "<@" + bal.user + "> : $" + bal.balance + "\n";
    }
    embed.addField("Page " + page, fieldValue);
    return embed;
}