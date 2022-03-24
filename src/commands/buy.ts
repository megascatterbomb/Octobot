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
    UserType,
} from "@frasermcc/overcord";
import { Collection, EmbedFieldData, Guild, Message, MessageEmbed, MessageEmbedOptions, Role, User } from "discord.js";
import { getUserBalance, subtractBalance } from "../database/octobuckBalance";
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "../utilities/helpers";
import { getPricingInfoForUser, shopItems } from "../utilities/shop";
import { ShopItem } from "../utilities/types";
import ShopCommand from "./shop";

@Alias("buy")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Purchase a specified item from the shop ($shop to view)")
export default class BuyCommand extends Command {
    @Argument({type: new IntegerType(), description: "The item to buy", optional: true})
    itemNum!: number
    @Argument({type: new UserType() || undefined, description: "User to target (required for some items)", optional: true})
    target!: User

    async execute(message: Message, client: Client) {
        const target = this.target ?? null; 
        if(this.itemNum === undefined) {
            new ShopCommand().execute(message, client);
            return;
        }
        const currentBalance: number = await getUserBalance(message.author) ?? 0;
        const shopItem: ShopItem = shopItems.get(Array.from(shopItems.keys())[this.itemNum - 1]) as ShopItem;
        const { specialRole, discountPrice } = await (await getPricingInfoForUser(message.author, message.guild, shopItem));
        const requiresTarget: boolean = shopItem.requiresTarget;
        if(requiresTarget && target === null) {
            throw new Error("You need to provide a target for this item. Syntax: $buy " + this.itemNum + " @Target");
        } else if(!requiresTarget && target !== null) {
            throw new Error("This item cannot accept a target. Syntax: $buy " + this.itemNum);
        }
        if(discountPrice === 0) {
            // allowedMentions specified to avoid pinging role.
            message.channel.send({content: "This is provided for free to players with the <@&" + specialRole + "> role. You do not need to purchase it.", allowedMentions: {roles: []}}) 
        } else if(currentBalance >= discountPrice) {
            const err: string = await shopItem.effect(message, target);
            if(err === "") {
                await subtractBalance(message.author, discountPrice);
            } else {
                throw new Error(err);
            }
        } else {
            message.channel.send("You have insufficient funds to purchase this item. Your balance is $" + currentBalance +" but the item costs $" + discountPrice)
        }
    }
}