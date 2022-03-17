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
    Described,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { getUserBalance } from "../database/octobuckBalance";

@Alias("balance", "bal", "money")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Get the balance of a user")
export default class PingCommand extends Command {
    @Argument({ type: new UserType() , optional: true, description: "The user whos balance to return. Leave blank to check your own"})
    user!: User;
    
    async execute(message: Message, client: Client) {
        const user: User = this.user === undefined ? message.author : this.user;

        if(user.bot) {
            message.channel.send("Could not find the balance of that user (bots cannot have a balance)");
            return;
        } 

        const displayName: string = await message.member?.nickname ?? message.author.username;

        let balance = await getUserBalance(user);
        
        if(balance === null && await message.guild?.members.fetch(user)) {
            message.channel.send("Could not find the balance of that user (they do not have a balance)");
            return;
        } else if (balance === null) {
            message.channel.send("Could not find the balance of that user (they are not in the server)");
            return;
        }

        message.channel.send("Balance of " + displayName + ": " + balance);
    }
}