import { EmbedFieldData, MessageEmbed, TextChannel, User } from "discord.js";
import { client } from "..";
import { Balance, getAllBalances, getUserBalance, massUpdateBalances } from "../database/octobuckBalance";
import { getDiscordNameFromID } from "../utilities/helpers";
import { allowedChannels, logChannel } from "../utilities/types";

// Specify the tax brackets relative to the average balance.
// Should be ordered lowest bracket to highest.
// Do not specify a tax thresMult below 1.

type Tax = {user: string, tax: number, newBalance: number};

const minTaxThreshold = 35;

const taxBrackets: {thresMult: number, percent: number}[] = 
    [{thresMult: 1, percent: 1}, {thresMult: 2, percent: 2}, {thresMult: 3, percent: 3}, {thresMult: 4, percent: 4},
        {thresMult: 5, percent: 5}, {thresMult: 10, percent: 10}, {thresMult: 15, percent: 12.5}, {thresMult: 20, percent: 15}];

export async function calculateTax(balance: number, taxThreshold?: number): Promise<number> {
    let subtract = 0;

    if(taxThreshold === undefined) {
        taxThreshold = await getTaxThreshold();
    }

    for(let i = 0; i < taxBrackets.length; i++) {
        if(balance > taxThreshold * taxBrackets[i].thresMult) {
            if(i != taxBrackets.length - 1) {
                const distanceToNextBracket = (taxBrackets[i+1].thresMult * taxThreshold) - balance; // Negative if balance goes into higher brackets.
                if(distanceToNextBracket <= 0) {
                    const bracketSize = (taxThreshold * (taxBrackets[i+1].thresMult - taxBrackets[i].thresMult));
                    subtract += bracketSize * taxBrackets[i].percent / 100; // Charge the full tax for this bracket then keep going.
                    continue;
                }
            }
            // We know balance lands somewhere within this bracket, either because this is the last bracket, or because the balance is below the threshold of the next.
            const balanceWithinBracket = balance - (taxBrackets[i].thresMult * taxThreshold);
            subtract += balanceWithinBracket * taxBrackets[i].percent / 100;
        } else {
            break;
        }
    }
    return Math.ceil(subtract);
}

async function getTaxThreshold(balances?: Balance[]) {
    if(balances === undefined) {
        balances = await getAllBalances(-1);
    }
    const octoUser: User = client.users.cache.get("167925663485919232") as User;
    const averageBalance = balances.reduce((acc, curr) => {
        return acc + curr.balance;
    }, 0) / balances.length;
    const taxThreshold = Math.ceil(Math.max(minTaxThreshold, Math.min(averageBalance, await getUserBalance(octoUser) ?? Number.MAX_VALUE)));
    return taxThreshold;
}

export async function fileTaxes(): Promise<Tax[]> {
    const balances: Balance[] = await getAllBalances(-1);

    const taxExempt: string[] = ["167925663485919232"]; // Octo

    const averageBalance = balances.reduce((acc, curr) => {
        return acc + curr.balance;
    }, 0) / balances.length;
    const taxThreshold = await getTaxThreshold(balances);

    const taxes: Tax[] = [];
    // Filters tax exempt + entries that do not require updating
    const taxableBalances = balances.filter((b) => (b.balance > taxThreshold || b.taxDeductible > 0) && !taxExempt.includes(b.user));
    for(let i = 0; i < taxableBalances.length; i++) {
        const b = taxableBalances[i];
        const baseTax = await calculateTax(b.balance, taxThreshold);
        const realTax = Math.max(baseTax - b.taxDeductible, 0);

        b.taxDeductible = Math.max(b.taxDeductible - Math.max(baseTax - realTax, 1), 0); // Always minus at least 1 per day. Prevents tax deductibles from lasting forever.
        b.balance -= realTax;
        taxes.push({user: b.user, newBalance: b.balance, tax: realTax});
    }

    await massUpdateBalances(taxableBalances);
    return taxes.filter((t) => t.tax > 0).sort((a, b) => b.tax - a.tax);
}

export async function generateTaxReport(taxes: Tax[]): Promise<MessageEmbed> {
    const embed: MessageEmbed = new MessageEmbed()
        .setColor(0xff8400)
        .setTitle("Octo GAMING Tax Report")
        .setDescription("Total amount lost to tax: $" + taxes.reduce((acc, curr) => { return acc + curr.tax; }, 0))
        .setFooter({text: "Not all taxes are listed here."});

    const guild = (client.channels.cache.get(allowedChannels[0]) as TextChannel).guild;

    // Need this to know how many spaces to use.
    const longestNameLength: number = Math.max(...await Promise.all(taxes.map<Promise<number>>(async (e: Tax) => {
        return (await getDiscordNameFromID(e.user, client, guild)).length;
    })));

    let fieldValue = "```";
    const maxTaxCount = 15;
    let count = 0;
    for(const tax of taxes){
        const name: string = await getDiscordNameFromID(tax.user, client, guild); 
        const spacesCount = longestNameLength - name.length;
        const spaces: string = spacesCount > 0 ? " ".repeat(longestNameLength - name.length) : "";
        fieldValue += "\n" + name + " " + spaces + "-$" + tax.tax + " (" + tax.newBalance + ")";
        
        count++;
        if(count >= maxTaxCount) {
            break;
        }
    }
    fieldValue.trimEnd();
    fieldValue += " ```";

    embed.addField("Highest taxed individuals", fieldValue);
    return embed;
}

// NEVER call this function outside of /index.ts
export async function taxLoop() {
    try {
        // eslint-disable-next-line no-constant-condition
        while(true) {
            await delay();
            const taxes = await fileTaxes();
            const embed = await generateTaxReport(taxes);
            (client.channels.cache.get(logChannel) as TextChannel)?.send({embeds: [embed]});
            (client.channels.cache.get(allowedChannels[0]) as TextChannel)?.send({embeds: [embed]});
        }
    } catch (err) {
        console.log("Tax Broke: " + err);
        client.users.cache.get("193950601271443456")?.send("Tax Broke: " + err);
    }
}

function delay() {
    const date1 = new Date().setUTCHours(0, 0, 0, 0) + 3600000; // Works between 12AM and 1AM UTC
    const date2 = new Date().setUTCHours(24, 0, 0, 0) + 3600000; // Works after 1AM UTC
    let time = 0;
    if(date1 > Date.now()) {
        time = date1 - Date.now();
    } else {
        time = date2 - Date.now();
    }
    if(time <= 0) {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    return new Promise(resolve => setTimeout(resolve, time));
}
