// Shop items are concretely defined here. Changes require update to the code.

import { Collection, Message, User, Permissions } from "discord.js";
import { getAllRoles, getSpecialRoles } from "./helpers";
import { Roles, ShopItem } from "./types";

const shopItems: Map<string, ShopItem> = new Map<string, ShopItem>([
    ["nickname", {name: "Nickname Perms", basePrice: 10, roleDiscounts: [{role: Roles.gamerGod, dPrice: 0}, {role: Roles.gamerPolice, dPrice: 0}, 
        {role: Roles.memeMachine, dPrice: 0}, {role: Roles.famousArtist, dPrice: 0}, {role: Roles.ggsVeteran, dPrice: 0}, {role: Roles.gigaGamer, dPrice: 0}], 
    effect: async (message: Message) => {
        if((await getSpecialRoles(message.author, message.guild)).entries.length !== 0 || message.member?.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
            await message.channel.send("One or more of your roles lets you change your nickname for free!");
            return;
        }
        
    }}],
]);



export default async function getShopEmbed() {

}