import { Guild, User, Role, Collection, Message, Client} from "discord.js";
import { Roles } from "./types";

export async function getAllRoles(user: User, guild: Guild | null): Promise<Collection<string, Role>> {
    if(guild === null) {
        throw new Error("Null Guild passed to getAllRoles");
    }
    return await guild.members.cache.get(user.id)?.roles.cache ?? new Collection<string, Role>();
}

export async function getSpecialRoles(user: User, guild: Guild | null): Promise<Collection<string, Role>> {
    return (await getAllRoles(user, guild)).filter((r) => r.id in Roles);
}

export async function getDiscordName(user: User, message: Message, client: Client): Promise<string> {
    return await (await message.guild?.members.fetch(user.id))?.displayName ?? user.username;
}