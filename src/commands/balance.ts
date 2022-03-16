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
    StringType,
    UserType,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { getUserBalance } from "../database/octobuckBalance";

@Alias("balance", "bal", "money")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
export default class PingCommand extends Command {
    @Argument({ type: new UserType() , optional: true})
    user!: User;
    
    async execute(message: Message, client: Client) {
        const user: User = this.user === undefined ? message.author : this.user;
        const balance: number = await getUserBalance(user.id);

        const displayName: string = await message.member?.nickname ?? message.author.username;

        message.channel.send("Balance of " + displayName + ": " + balance);
    }
}