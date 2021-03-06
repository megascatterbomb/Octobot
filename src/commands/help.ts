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
import { EmbedFieldData, Message, MessageEmbed } from "discord.js";
import ChannelCommand from "../extensions/channelCommand";
import { shopItems } from "../utilities/shop";

@Alias("help", "\\?")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("List available commands")
export default class HelpCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        message.reply({embeds: [await generateRichEmbed(client)]});
    }
}

// TODO: Find an automatic way of doing this (create feature request on overcord if necessary)
async function generateRichEmbed(client: Client): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Help Menu")
        .setDescription("Server prefix is `$`. These commands can only be run in the <#957061767920513164> channel. Some commands have multiple aliases.")
        .setFooter({text: "Check the pinned messages to learn how to earn Octobucks.\nOctobot built and maintained by megascatterbomb."});
    
    const fields: EmbedFieldData[] = [{
        name: "$balance,  $bal,  $money  -  Args: `Target (User)`",
        value: "Get the balance of a user. Running the command with no target checks your own balance."
    },{
        name: "$buy  -  Args: `Shop Item (string), Argument (any)`",
        value: "Buy an item from the shop. Some items require an argument that changes how the item behaves."
    },{
        name: "$give,  $send,  $trade  -  Args: `Recipient (User), Amount (number)`",
        value: "Send someone your precious Octobucks."
    },{
        name: "$help,  $?  -  Args: `none`",
        value: "Display this help menu."
    },{
        name: "$leaderboard,  $rich  -  Args: `Page (number)`",
        value: "View the richest players on the server."
    },{
        name: "$lottery,  $lot  -  Args: `none`",
        value: "View information about the lottery, including the time of the next draw."
    },{
        name: "$ping,  $hello,  $test  -  Args: `none`",
        value: "Check if Octobot is alive and well."
    },{
        name: "$shop  -  Args: `Page (number)`",
        value: "View items available for purchase, including any special discounts you're eligible for."
    },{
        name: "$stats  -  Args: `none`",
        value: "View statistics about the economy."
    },{
        name: "$uptime  -  Args: `none`",
        value: "Check how long the bot has been up for."
    },
    ];

    embed.addFields(fields);
    return embed;
}