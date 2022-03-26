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
import { addBalance, registerBalance, setBalance } from "../database/octobuckBalance";
import { getDiscordName } from "../utilities/helpers";

@Alias("setbalance", "set")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Set the balance of a user")
export default class SetBalanceCommand extends Command {
    @Argument({ type: new UserType(), description: "The user to set the balance of"})
        user!: User;

    @Argument({ type: new IntegerType(), description: "The user's new balance"})
        amount!: number;

    async execute(message: Message, client: Client) {
        const displayName: string = await getDiscordName(this.user, message, client);
        const err: string = await setBalance(this.user, this.amount);
        if(err !== "") {
            throw new Error(err);
        }
        message.channel.send("Sucessfully set balance of " + displayName + " to $" + this.amount);
    }
}