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
    UserType,
    Described,
    StringType,
    ChannelType,
    OwnerOnly,
} from "@frasermcc/overcord";
import { AnyChannel, Channel, GuildMember, Message, StageChannel, TextChannel, ThreadChannel, User, VoiceChannel } from "discord.js";
import { addBalance, registerBalance, setBalance } from "../database/octobuckBalance";
import { getDiscordName } from "../utilities/helpers";

@Alias("messageuser", "msguser", "msgu")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Set the balance of a user")
export default class MessageUserCommand extends Command {
    @Argument({ type: new UserType(), description: "The user to message in DMs"})
        user!: User;

    @Argument({ type: new StringType(), description: "Message to send", infinite: true})
        messageToSend!: string[];

    async execute(message: Message, client: Client) {
        const userObject: GuildMember | null = message.guild?.members.cache.get(this.user.id) ?? null;
        if(userObject === null) {
            throw new Error("Invalid user");
        }
        userObject.send(this.messageToSend.join(" "));
    }
}