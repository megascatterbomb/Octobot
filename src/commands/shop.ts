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
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "../utilities/helpers";
import { getPricingInfoForUser, shopItems } from "../utilities/shop";
import { Roles } from "../utilities/types";

@Alias("shop")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("View items available for purchase")
export default class ShopCommand extends Command {

    async execute(message: Message, client: Client) {
        const embed: MessageEmbed = await generateRichEmbed(message.author, message?.guild)
        message.channel.send({embeds: [embed]});
    }
}

async function generateRichEmbed(user: User, guild: Guild | null): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Store")
        .setDescription("Purchase an item using `$buy #` eg: `$buy 1`")
        .setFooter({text: "Purchases are non-refundable. Spend wisely!"})
    
    const fields: EmbedFieldData[] = [];

    let userSpecialRoles: Roles[] = await convertToRolesEnum(await getSpecialRoles(user, guild));

    let itemID: number = 1;

    for(const item of shopItems.values()){

        // Get the minimum price the user is eligible for.
        const { specialRole, discountPrice } = await getPricingInfoForUser(user, guild, item);
        console.log(specialRole + " " + discountPrice);
        const hasDiscount: boolean = specialRole !== "";
        
        const field = {
            name: "\#" + itemID + ": " + item.name + " - " + (hasDiscount ? "~~$" + item.basePrice + "~~" : "$" + item.basePrice),
            value: (hasDiscount ? "**<@&" + specialRole + "> special price: $" + discountPrice + "**" + "\n" : "") + item.description
        };
        fields.push(field);
        itemID++;
    };

    embed.addFields(fields);
    return embed;
}