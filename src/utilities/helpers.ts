import { Guild, User, Role, Collection, Message, Client} from "discord.js";
import { Roles } from "./types";

export async function getAllRoles(user: User, guild: Guild | null): Promise<Collection<string, Role>> {
    if(guild === null) {
        throw new Error("Null Guild passed to getAllRoles");
    }
    return await guild.members.cache.get(user.id)?.roles.cache ?? new Collection<string, Role>();
}

export async function getSpecialRoles(user: User, guild: Guild | null): Promise<Collection<string, Role>> {
    return (await getAllRoles(user, guild)).filter((r) => Object.values(Roles).includes(r.id as Roles));
}

// TODO: Fix always returning empty array
export async function convertToRolesEnum(rolesIn: Collection<string, Role>): Promise<Roles[]> {
    const rolesOut: Roles[] = Object.values(Roles).filter((r) => [...rolesIn.keys()].includes(r));
    return rolesOut;
}

export async function getDiscordName(user: User, message: Message, client: Client): Promise<string> {
    return await (await message.guild?.members.fetch(user.id))?.displayName ?? user.username;
}