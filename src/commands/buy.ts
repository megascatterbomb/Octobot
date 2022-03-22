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
import { getUserBalance } from "../database/octobuckBalance";
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "../utilities/helpers";
import { getPricingInfoForUser, shopItems } from "../utilities/shop";
import { Roles, ShopItem } from "../utilities/types";

@Alias("buy")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Purchase a specified item from the shop ($shop to view)")
export default class PingCommand extends Command {
    @Argument({type: new IntegerType(), description: "The item to buy"})
    itemNum!: number

    async execute(message: Message, client: Client) {
        const currentBalance: number = await getUserBalance(message.author) ?? 0;
        const shopItem: ShopItem = shopItems.get(Array.from(shopItems.keys())[this.itemNum - 1]) as ShopItem;
        const { specialRole, discountPrice } = await (await getPricingInfoForUser(message.author, message.guild, shopItem));

        if(discountPrice === 0) {
            // allowedMentions specified to avoid pinging role.
            message.channel.send({content: "This is provided for free to players with the <@&" + specialRole + "> role. You do not need to purchase it.", allowedMentions: {roles: []}}) 
        } else if(currentBalance >= discountPrice) {
            // Do purchase
        } else {
            message.channel.send("You have insufficient funds to purchase this item. Your balance is $" + currentBalance +" but the item costs $" + discountPrice)
        }
    }
}