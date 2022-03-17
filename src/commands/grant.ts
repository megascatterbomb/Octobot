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
import { addBalance, registerBalance } from "../database/octobuckBalance";

@Alias("grant", "bestow")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
export default class PingCommand extends Command {
    @Argument({ type: new UserType(), description: "The user to bestow Octobucks upon."})
    user!: User;

    @Argument({ type: new IntegerType(), description: "Amount of Octobucks to bestow."})
    amount!: number;

    async execute(message: Message, client: Client) {
        const displayName: string = await message.member?.nickname ?? message.author.username;
        const success: boolean = await addBalance(this.user, this.amount);
        message.channel.send(success ?
            "Sucessfully bestowed $" + this.amount + " to " + displayName :
            "Failed to bestow octobucks");
    }
}