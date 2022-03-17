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
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { addBalance, registerBalance } from "../database/octobuckBalance";

@Alias("grant", "bestow")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Grant Octobucks to a user")
@Permit("ADMINISTRATOR")
export default class PingCommand extends Command {
    @Argument({ type: new UserType(), description: "The user to bestow Octobucks upon"})
    user!: User;

    @Argument({ type: new IntegerType(), description: "Amount of Octobucks to bestow"})
    amount!: number;

    async execute(message: Message, client: Client) {
        const displayName: string = await (await message.guild?.members.fetch(this.user.id))?.displayName ?? this.user.username;
        const err: string = await addBalance(this.user, this.amount);
        message.channel.send(err ?
            "Failed to bestow octobucks: " + err :
            "Sucessfully bestowed $" + this.amount + " to " + displayName);
    }
}