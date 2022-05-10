import {
    Alias,
    Inhibit,
    Command,
    Argument,
    IntegerType,
    Client,
    Described,
    UserType,
    StringType,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { addTaxDeduction, getUserBalance, subtractBalance } from "../database/octobuckBalance";
import { getPricingInfoForUser, shopItems } from "../utilities/shop";
import { ShopItem } from "../utilities/shop";
import ChannelCommand from "../extensions/channelCommand";
import ShopCommand from "./shop";
import { logShopTransaction } from "../utilities/log";

export let shopOpen = true;

@Alias("buy")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Purchase a specified item from the shop ($shop to view)")
export default class BuyCommand extends ChannelCommand {
    @Argument({type: new StringType(), description: "The item to buy", optional: true})
        itemName!: string;
    @Argument({type: new UserType() || undefined, description: "User to target (required for some items)", optional: true})
        target!: User;

    async execute(message: Message, client: Client) {
        if(!shopOpen) {
            message.reply("Sorry, the shop is closed. Come back later.");
            return;
        }
        const target = this.target ?? null; 
        if(this.itemName === undefined || this.itemName === "") {
            new ShopCommand().execute(message, client);
            return;
        }
        const currentBalance: number = await getUserBalance(message.author) ?? 0;
        const shopItem: ShopItem = shopItems.get(this.itemName) as ShopItem;
        if(shopItem === undefined) {
            throw new Error("\"" + this.itemName + "\" isn't a valid item name. Use $shop to view available items");
        }
        const { specialRole, discountPrice } = await (await getPricingInfoForUser(message.author, message.guild, shopItem));
        const requiresTarget: boolean = shopItem.requiresTarget;
        if(requiresTarget && target === null) {
            throw new Error("You need to provide an arugment for this item. Syntax: $buy " + this.itemName + " @Target");
        } else if(!requiresTarget && target !== null) {
            throw new Error("This item cannot accept an argument. Syntax: $buy " + shopItem.commandSyntax);
        }
        if(discountPrice === 0) {
            // allowedMentions specified to avoid pinging role.
            message.reply({content: "This is provided for free to players with the <@&" + specialRole + "> role. You do not need to purchase it.", allowedMentions: {roles: []}}); 
        } else if(currentBalance >= discountPrice) {
            const err: string = await shopItem.effect(message, target);
            if(err === "") {
                await subtractBalance(message.author, discountPrice);
                await addTaxDeduction(message.author, discountPrice);
                await logShopTransaction(message.author, this.itemName, discountPrice);
            } else {
                throw new Error(err);
            }
        } else {
            throw new Error("You have insufficient funds to purchase this item. Your balance is $" + currentBalance +" but the item costs $" + discountPrice);
        }
    }
}

export function setShopOpen(status: boolean) {
    shopOpen = status;
}