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
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { addBalance, registerBalance, setBalance } from "../database/octobuckBalance";

@Alias("setbalance", "set")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
export default class PingCommand extends Command {
    @Argument({ type: new UserType(), description: "The user to set the balance of"})
    user!: User;

    @Argument({ type: new IntegerType(), description: "The user's new balance"})
    amount!: number;

    async execute(message: Message, client: Client) {
        const displayName: string = await (await message.guild?.members.fetch(this.user.id))?.displayName ?? this.user.username;
        const success: boolean = await setBalance(this.user, this.amount);
        message.channel.send(success ?
            "Sucessfully set balance of $" + displayName + " to $" + this.amount :
            "Failed to set balance");
    }
}