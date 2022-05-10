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
import { SpecialRole } from "../utilities/config";
import { shopOpen } from "./buy";

const pageSize = 5;

@Alias("shop")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("View items available for purchase")
export default class ShopCommand extends ChannelCommand {
    @Argument({ type: new IntegerType(), description: "Choose a page of the shop", optional: true})
        page!: number;

    async execute(message: Message, client: Client) {
        this.page = this.page ?? 1; // @Argument can't set default when execute is called from $buy, so we set it here.
        if(!shopOpen) {
            message.channel.send("Sorry, the shop is closed. Come back later.");
            return;
        }
        const embed: MessageEmbed = await generateRichEmbed(message.author, message?.guild, this.page);
        message.reply({embeds: [embed]});
    }
}

async function generateRichEmbed(user: User, guild: Guild | null, page: number): Promise<MessageEmbed> {

    const shopItemCount = shopItems.size;
    const maxPages = Math.ceil(shopItemCount/pageSize);

    if(page < 1 || page > maxPages) {
        throw new Error("Invalid Page number. Page must be between 1 and " + maxPages);
    }

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Store - Page " + page + " of " + maxPages)
        .setDescription("Purchase items using the `$buy` command. Some items require special arguments; look below the item name for exact syntax.")
        .setFooter({text: "Purchases are non-refundable. Spend wisely!"});
    
    const fields: EmbedFieldData[] = [];

    const userSpecialRoles: SpecialRole[] = await convertToRolesEnum(await getSpecialRoles(user, guild));

    let itemCounter = 0; // One based, but start at zero to account for counter

    for(const item of shopItems.values()){
        itemCounter++;
        if(itemCounter > shopItemCount) {
            break;
        } else if(Math.ceil(itemCounter / pageSize) !== page) {
            continue;
        }

        // Get the minimum price the user is eligible for.
        const { specialRole, discountPrice } = await getPricingInfoForUser(user, guild, item);
        const hasDiscount: boolean = specialRole !== "";
        
        const field = {
            name: /*"#" + itemID + ": " +*/ item.name + " - " + (hasDiscount ? "~~$" + item.basePrice + "~~" : "$" + item.basePrice),
            value: (hasDiscount ? "**<@&" + specialRole + "> special price: $" + discountPrice + "**" + "\n" : "") + ("`$buy " + item.commandSyntax + "`\n") + item.description
        };
        fields.push(field);
    }

    embed.addFields(fields);
    return embed;
}