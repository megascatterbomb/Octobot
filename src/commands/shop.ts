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
    StringType,
} from "@frasermcc/overcord";
import { Collection, EmbedFieldData, Guild, Message, MessageEmbed, MessageEmbedOptions, Role, User } from "discord.js";
import ChannelCommand from "../extensions/channelCommand";
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "../utilities/helpers";
import { getPricingInfoForUser, shopItems } from "../utilities/shop";
import { SpecialRole } from "../utilities/types";
import { shopOpen } from "./buy";

@Alias("shop")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("View items available for purchase")
export default class ShopCommand extends ChannelCommand {

    async execute(message: Message, client: Client) {
        if(!shopOpen) {
            message.channel.send("Sorry, the shop is closed. Come back later.");
            return;
        }
        const embed: MessageEmbed = await generateRichEmbed(message.author, message?.guild);
        message.channel.send({embeds: [embed]});
    }
}

async function generateRichEmbed(user: User, guild: Guild | null): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Store")
        .setDescription("Purchase an item using `$buy #` eg: `$buy 1` \nFor commands that require a target, mention the target after the number:\n`$buy 2 @Octo`")
        .setFooter({text: "Purchases are non-refundable. Spend wisely!"});
    
    const fields: EmbedFieldData[] = [];

    const userSpecialRoles: SpecialRole[] = await convertToRolesEnum(await getSpecialRoles(user, guild));

    let itemID = 1;

    for(const item of shopItems.values()){

        // Get the minimum price the user is eligible for.
        const { specialRole, discountPrice } = await getPricingInfoForUser(user, guild, item);
        const hasDiscount: boolean = specialRole !== "";
        
        const field = {
            name: "#" + itemID + ": " + item.name + " - " + (hasDiscount ? "~~$" + item.basePrice + "~~" : "$" + item.basePrice),
            value: (hasDiscount ? "**<@&" + specialRole + "> special price: $" + discountPrice + "**" + "\n" : "") + item.description
        };
        fields.push(field);
        itemID++;
    }

    embed.addFields(fields);
    return embed;
}