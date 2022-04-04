import { Message, User } from "discord.js";

export enum SpecialRole {
    gamerGod = "789100430964949022",
    gamerPolice = "789099931889041409",
    memeMachine = "835077108699103253",
    famousArtist = "818715240707522580",
    ggsVeteran = "812902048730579004",
    gigaGamer = "813904207115059222"
}

export const nickNameRole = "956338276833312819";
export const funnyMuteRole = "956338504646950942";
export const cringeMuteRole = "814895755886198814"; // Managed by Dyno, do not add/remove this role from players.
export const offTopicImageRole = "956369590294818826";
export const basementDwellerRole = "956369181589258280";

// The first channel in this is treated as the main channel for commands.
export const allowedChannels: string[] = [
    "957061767920513164", // Octobot commands
    "574157660488859670", // Beta testing channel
    "814881168263872532" // Gamer Police bot-commands
];

export const logChannel = "947220771913228288";

export type ShopItem = {
    name: string,
    basePrice: number,
    roleDiscounts: {role: SpecialRole, dPrice: number}[],
    // Purchases should always have a message associated with them; user and guild can be derived from this.
    // Additional arguments are the responsibility of shop item implementers to manage.
    // returns: true if successfully used. false otherwise. Indicates to caller whether to consume a consumable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    effect: (message: Message, ...args: any[]) => Promise<string>,
    scheduledEvent: null | ((userID: string, guildID: string) => Promise<string>),
    description: string,
    requiresTarget: boolean
}

//let test: ShopItem = {name: "test", basePrice: 100, roleDiscounts: [], effect: async (initiator: User, user2: User) => console.log("Test")}; 