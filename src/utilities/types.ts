import { Message, User } from "discord.js";

export enum Roles {
    gamerGod = "789100430964949022",
    gamerPolice = "789099931889041409",
    memeMachine = "835077108699103253",
    famousArtist = "818715240707522580",
    ggsVeteran = "812902048730579004",
    gigaGamer = "813904207115059222"
}

export type ShopItem = {
    name: string,
    basePrice: number,
    roleDiscounts: {role: Roles, dPrice: number}[],
    // Purchases should always have a message associated with them; user and guild can be derived from this.
    // Additional arguments are the responsibility of shop item implementers to manage.
    // returns: true if successfully used. false otherwise. Indicates to caller whether to consume a consumable.
    effect: (message: Message, ...args: any[]) => Promise<boolean>,
    scheduledEvent: null | ((userID: string, guildID: string) => Promise<boolean>)
}

//let test: ShopItem = {name: "test", basePrice: 100, roleDiscounts: [], effect: async (initiator: User, user2: User) => console.log("Test")}; 