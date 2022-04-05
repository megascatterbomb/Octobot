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

@Alias("messagechannel", "msgchannel", "msgc")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Set the balance of a user")
export default class MessageChannelCommand extends Command {
    @Argument({ type: new ChannelType(), description: "The user to message in DMs"})
        channel!: Channel;

    @Argument({ type: new StringType(), description: "Message to send", infinite: true})
        messageToSend!: string[];

    async execute(message: Message, client: Client) {
        if(this.channel === null) {
            throw new Error("Invalid channel.");
        }
        if(this.channel instanceof TextChannel || ThreadChannel) {
            (this.channel as TextChannel | ThreadChannel).send(this.messageToSend.join(" "));
        } else {
            throw new Error("Invalid channel.");
        }
    }
}