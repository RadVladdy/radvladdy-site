---
title: "I rebuilt my entire web presence in one day (the AI did the typing)"
subtitle: "What an agent can do in a day — and the one thing it can't."
date: 2026-06-11
block: 953194
---

One Wednesday morning this month, this website was a museum. A WordPress site I built in 2020, sitting on shared hosting I was still paying for, wearing a cartoon avatar with bitcoin sunglasses, last meaningfully touched when we all still said "lockdown" daily. My profile links pointed at it from every corner of Nostr. It was the digital equivalent of handing someone a business card that crumbles.

By midnight that same day: a brand-new site, live on a new stack, with a new design, the domain migrated off the old host, the hosting bill canceled, a live Bitcoin ticker on the homepage, my identity verifiable against my own domain, and a payment address that can receive sats while my phone is dead in a drawer — tested, with real sats.

My total contribution to this miracle was taste, passwords, and 21 sats.

The typing — all of it — was done by an AI agent. And the most interesting part of the day wasn't what the machine could do. It's the one thing it couldn't.

## The funeral

The old site didn't deserve cruelty; it deserved a flag-folding ceremony. In 2020 it was my orange-pilling machine — a curriculum, reposts, price charts. But websites are like gardens: stop tending one and it doesn't pause, it *decays in public*. I was paying rent on the decay.

So, rule one of the rebuild: scrap everything, keep the receipts. Before anything else, the agent pulled every post off the old site through its API — thirty posts, forty-five pages, every word archived — because around here we don't delete history, we just stop paying hosting fees on it. (Fun fact the machine discovered along the way: the Internet Archive had never once managed to crawl my old site. The Wayback Machine — the internet's librarian, who archives *everything* — had timed out on my shared hosting for six years straight. The new site got archived in 6.6 seconds. I choose to find this funny instead of embarrassing.)

## What the robot did

I want to be precise here, because "AI built my website" usually means someone generated a landing page with stock gradients. That is not what happened. Over roughly sixteen hours, the agent:

- Designed the whole look from one input — my avatar — pulling the cyan of the glowing eye out as the site's signature color, then building the dark terminal aesthetic around it: the prompt header, the film grain, a city skyline with windows that flicker.
- Wired a live chain ticker to the homepage — block height, fees, sats-per-dollar — so the site has a pulse.
- Decoded my Nostr pubkey with a from-scratch implementation of the encoding spec, checksum-verified, before publishing it as my identity record — because *verify, don't trust* applies to robots too, especially robots.
- Ran forensics on my DNS and found twenty-eight dead records pointing at services that no longer existed, like opening a junk drawer full of keys to houses you sold.
- Found out my zaps had been silently broken for ages — that one hurt enough to get [its own essay](/writing/your-zaps-are-probably-broken).
- Built the fix: my identity *and* my payment address now live at my own domain, behind plumbing I control, so no third party can ever silently break them again.
- And then verified its own work the only way that counts: it requested a real Lightning invoice through the new rails and watched the whole handshake succeed.

Sixteen hours. Code, design, DNS surgery, cryptography, payments. On a normal market that's four different consultants and three weeks of "circling back."

## What the robot couldn't do

Here's the honest ledger of what I actually did all day, and why it mattered.

I logged into things. The registrar, the host, the dashboards — every account boundary was mine to cross, because the machine doesn't have accounts. I clicked the scary buttons: nameservers, domain cutover. I sent the 21 test sats from a second wallet, phone face-down on the counter, to prove the receive rail worked without me.

And I made the calls no machine can make for you. That the avatar crop had gone too far — "you've clipped the chin." That the hero needed *rain*. That my pseudonym's first name was Rad, not Vlad — yes, I renamed myself mid-build; the machine swept the change through every file without complaint, like a tailor who doesn't ask why.

Taste, custody, authority. That was my whole job. It turns out that's the whole *human* job now, and it's not a demotion — it's the part that was always the point.

## The part that should make you sit up

Now zoom out, because this is bigger than my blog.

An AI agent did a full day of skilled labor for me. Real economic output — the kind people invoice for. It worked, it verified, it shipped. And if that agent had needed to *buy* anything along the way — an API call, a dataset, a server, ten minutes of another agent's time — it would have hit a wall that no amount of intelligence solves: **the machine cannot have a bank account.** Go ahead, picture it: a language model at a bank branch, trying to KYC. Two forms of ID. Proof of address. A selfie.

It can't hold a Visa. It can't pass a credit check. The entire legacy financial system is built on identifying *humans* — and agents aren't humans, and they're not getting passports.

But keys? A machine can hold keys just fine. It can request an invoice, verify a payment, settle in seconds, no permission slip required — my own site's payment plumbing was tested *by* the machine, *with* a real invoice, as a routine step. The money that works for software already exists, and you already know its name.

That thought is a rabbit hole, and I fell down it hard enough to build [a whole site about it](https://bitcoineconomy.ai). Consider this essay the trailer.

## The bill

Final accounting for the day: one domain migrated, one museum archived, one identity made sovereign, one payment rail proven, one hosting subscription killed forever. Net new monthly cost: zero. [The repo is public](https://github.com/RadVladdy/radvladdy-site) — the design, the worker, the identity files, all of it — steal whatever's useful.

And yes, obviously, an AI helped with this post too — it helps with everything around here now. But let's be clear about the org chart: the machine works for Rad. Think of it as a hydraulic exoskeleton for one pseudonymous bitcoiner — same guy inside, just bigger, stronger, faster. The war stories, the opinions, the taste calls, and the sats are all mine. The robot mostly makes sure "sovereignty" has the right number of e's. ⚡

---

*P.S. — The old cartoon avatar with the bitcoin sunglasses is preserved in the archive, where it can embarrass me with its original timestamps intact. Receipts or it didn't happen.*
