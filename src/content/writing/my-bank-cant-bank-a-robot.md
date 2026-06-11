---
title: "My bank can't bank a robot"
subtitle: "The most important customer of the next decade can't pass KYC."
date: 2026-06-11
block: 953194
---

An AI agent can write a legal brief, book your flights, debug your code, negotiate with another AI agent, and run a small business with unsettling competence.

It cannot open a checking account.

Picture the attempt. The agent arrives at the branch — already a problem, no legs. Two forms of government ID, please. Proof of address; the agent lives in a data center in Virginia, sort of, sometimes. A selfie holding today's newspaper. Mother's maiden name — the agent has 175 billion parameters and no mother.

Everyone in this story is doing their job correctly. That's what makes it funny — and what makes it, quietly, one of the most consequential facts in finance. Because the obvious question is coming faster than most people think: *if software is about to be doing real work and buying real things... what money does it use?*

## Money for people who can show ID

Step back and look at what a bank account actually is, under the marble and the app: it's an entry in a ledger *attached to a legal person*. Everything in the legacy financial system hangs off that attachment. Credit checks. Fraud law. Chargebacks. Account recovery. The entire apparatus assumes there's a human at the bottom of every transaction — someone who can be identified, sued, subpoenaed, or sent to the principal's office.

That assumption was fine for three hundred years. It just expired.

"But companies bank fine, and they're not humans." Right — because a corporation is a costume that humans wear; there's always a signatory, a beneficial owner, a name on the line. And yes, today's workaround is exactly that: a human opens the account, and the bot gets the API key. Which works, at hobby scale, the way letting your teenager use your credit card "works."

Now scale it. Not one bot — millions of agents, transacting with *each other*, thousands of times a minute, in amounts smaller than the card networks' minimum fee. Buying ten seconds of GPU time. Paying another agent for a translation. Settling and moving on, at machine tempo, around the clock. The permission-slip model doesn't bend to that world. There aren't enough humans to sign for it, and there's no fraud department on Earth staffed for customers who think in milliseconds.

## Money for anything that can hold a secret

Now look at the other system. The one with no accounts at all.

Bitcoin doesn't know what a person is. It has never asked. There's no application form, because there's nothing to apply *to* — there are only keys, and whoever holds a key can spend what it controls. Identity isn't required; it isn't even *representable*. The system's one demand is that you can generate and guard a secret and sign with it.

Read that demand again, and notice something: it describes machines *better than it describes us*. We're the ones who write passwords on sticky notes. Cryptography is the machine's native sport.

And the speed layer is already built. Lightning does instant, final settlement in amounts smaller than anyone's minimum fee — sats, not statements. No monthly billing cycle, no card-on-file, no chargeback theater. A payment is just a message that happens to be money, which is exactly the shape a machine wants its money in.

So here's the whole thesis, sized for a t-shirt: **the legacy system banks identities; bitcoin banks keys. Agents have no identity and excellent keys.**

## This isn't future tense

I want to be careful here, because every AI essay drifts into someday-ism. So, receipts:

The payment plumbing on this very website was tested by an AI agent — it requested a real Lightning invoice through my own rails and verified the handshake end-to-end, as a routine step, the same day it built the thing. Nobody from a bank was consulted. Nothing applied for permission.

And out on the open internet, there are already marketplaces where AI inference is priced in sats and paid by software — APIs with price tags machines can read, compare, and settle without a human in the loop. Small? Sure. So was every other corner of this space, right before it wasn't.

## When the customer has no childhood

One more thought, because it's the part that should keep some executives up at night.

Every moat in consumer finance is psychological. Brand trust. Switching costs. The vague warm feeling of the bank your parents used. Rewards points, which are a slot machine for adults.

An agent has none of that. No nostalgia, no laziness, no brand loyalty — no *childhood*. It reads the fee schedule, measures the latency, checks the uptime, and routes to the best venue, every single time, forever. The first economy where every customer compares every option on every purchase is the most honest market that will ever exist.

Legacy finance can't even let that customer through the front door. The other system was — accidentally or not — designed for it from block one.

## The long version

This rabbit hole goes deep — deep enough that I spent a long stretch of this year building [an entire site](https://bitcoineconomy.ai) that makes the full argument: for humans on one track, and specified formally for the agents themselves on another.

Consider this the napkin sketch. The machines are coming to the economy either way. The only open question is whose money they'll be carrying — and they can't carry the kind that needs a selfie. ⚡

---

*P.S. — Written with the help of an AI that, for the record, has never once been approved for a credit card.*
