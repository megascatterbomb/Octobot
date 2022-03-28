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
        message.channel.send({embeds: [await generateRichEmbed(client)]});
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
        value: "Get the balance of a user. Running the command with no target checks your own balance. Please note that if you've never interacted with the economy you won't have a balance."
    },{
        name: "$buy  -  Args: `Shop Item (number), Target (User)`",
        value: "Buy an item from the shop. Some items require a target that the item will be used on."
    },{
        name: "$help,  $?  -  Args: `none`",
        value: "Display this help menu."
    },{
        name: "$ping,  $hello,  $test  -  Args: `none`",
        value: "Check if Octobot is alive and well."
    },{
        name: "$send,  $trade  -  Args: `Recipient (User), Amount (number)`",
        value: "Send someone your precious Octobucks."
    },{
        name: "$shop  -  Args: `none`",
        value: "View items available for purchase, including any special discounts you're eligible for."
    },
    ];

    embed.addFields(fields);
    return embed;
}