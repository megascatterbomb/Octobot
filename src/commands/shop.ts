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
import { convertToRolesEnum, getSpecialRoles } from "../utilities/helpers";
import { shopItems } from "../utilities/shop";
import { Roles } from "../utilities/types";

@Alias("shop")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("View items available for purchase")
export default class PingCommand extends Command {

    async execute(message: Message, client: Client) {
        const embed: MessageEmbed = await generateRichEmbed(message.author, message?.guild)
        message.channel.send({embeds: [embed]});
    }
}

async function generateRichEmbed(user: User, guild: Guild | null): Promise<MessageEmbed> {

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Store")
        .setDescription("Purchase an item using `$buy <itemName>`")
        .setFooter({text: "Purchases are non-refundable. Spend wisely!"})
    
    const fields: EmbedFieldData[] = [];

    let userSpecialRoles: Roles[] = await convertToRolesEnum(await getSpecialRoles(user, guild));

    shopItems.forEach(async (item) => {

        // Get the minimum price the user is eligible for.
        const { role: specialRole, dPrice: discountPrice } = await item.roleDiscounts.filter(async (r) => {
            return userSpecialRoles.includes(r.role);
        }).reduce((prev, curr) => {
            return prev.dPrice < curr.dPrice ? prev : curr;
        });

        const field = {
            name: item.name + " - $" + item.basePrice + " (<@#" + specialRole + " discount: $" + discountPrice + ")",
            value: item.description
        };

        fields.push(field);
    });

    embed.setFields(fields);

    return embed;
}