import { Guild, User, Role, Collection, Message, Client} from "discord.js";

export async function getAllRoles(user: User, guild: Guild): Promise<Collection<string, Role>> {
    return await guild.members.cache.get(user.id)?.roles.cache ?? new Collection<string, Role>();
}

export async function getSpecialRoles(user: User, guild: Guild): Promise<Collection<string, Role>> {
    return (await getAllRoles(user, guild)).filter((r) => r.id in Role);
}

export async function getDiscordName(user: User, message: Message, client: Client): Promise<string> {
    return await (await message.guild?.members.fetch(user.id))?.displayName ?? user.username;
}