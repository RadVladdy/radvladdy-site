---
title: "Verify this blog"
subtitle: "Every blog you've ever read asks you to trust its dates. This one doesn't."
date: 2026-06-11
block: 953194
---

Here's a small, dirty secret about the internet: dates are vibes.

That timestamp on the brilliant essay that "called everything back in 2021"? It's a text field. The author can type whatever they want into it. Every blogging platform on Earth lets you backdate a post in roughly two clicks — change the date, hit save, and congratulations, you've always been right about everything. Nobody checks. Nobody *can* check.

Which is a problem for me specifically, because I'm a pseudonym with laser eyes claiming to have receipts going back to 2019, and you have absolutely no reason to take my word for it.

Good. You shouldn't. Let me show you what I did instead.

## The most paranoid clock ever built

Bitcoin, among everything else it is, is a clock. An expensive, slow, magnificent clock — a new tick roughly every ten minutes, each one chained to every tick before it, secured by more raw computation than every other thing humanity does combined. To rewrite what that clock said last year, you'd have to out-compute the entire network for longer than the rest of the world combined — which is a polite way of saying *the past is closed*.

The whitepaper's own words for the design are "a distributed **timestamp server**." Making the past unforgeable isn't a side effect of bitcoin. It's the job description.

So here's the obvious thought, the one a protocol called **OpenTimestamps** turned into free software: if the world's most tamper-proof clock is just sitting there ticking... why is anyone still trusting text fields?

## How it works (no wizard hat required)

Every post on this site now goes through the same little ceremony:

1. The finished post gets *fingerprinted* — a cryptographic hash, a short string that changes completely if even one comma in the post changes.
2. That fingerprint gets anchored into the Bitcoin timechain, batched in with thousands of others.
3. The proof — a small file linking *this exact text* to *that exact block* — gets published right alongside the post.

The result is a statement no one has to take on faith: **this exact essay, every comma of it, existed on or before the date of that block.** Not because I'm trustworthy. Because rewriting that claim would mean rewriting bitcoin itself, and the meter on that attack starts at billions.

To check me: every post links its proof file, and [the verify page](/verify) walks you through it — drag, drop, done. You don't need my permission, my cooperation, or my continued existence. That last one is rather the point of the whole exercise.

## What it proves — and what it honestly doesn't

This site runs on receipts, so let's be precise about what this receipt says.

It proves the post **existed by** a certain date, unchanged since. It does *not* prove I wrote it, that it's true, or that I wasn't wrong — being wrong on the record remains fully supported. (See: my archive.)

And about that archive: the 2019–2021 posts can't be retro-stamped — you can't notarize the past with a clock you only started using today, and anyone who claims otherwise is selling something. Those old dates rest on old-fashioned evidence: the original export, the platform records, the people who read them at the time. Everything from *this post forward* rests on Bitcoin. That's the honest line between my history and my proof, drawn exactly where it belongs.

## Why bother?

Because "verify, don't trust" is the founding manners of this entire culture, and it shouldn't stop applying the moment a bitcoiner opens a blog.

We are, as a tribe, professionally obsessed with provable history. We run nodes to check the ledger ourselves. We mock "trust me" finance. And then we publish our big calls on platforms where the past is a text field, and expect the trust we'd never extend to anyone else. It's a little embarrassing once you see it — and it's *free* to fix. The protocol is open, the tooling exists, and the marginal cost of stamping a post is nothing.

So consider this both an announcement and a challenge. Announcement: everything I publish here is now anchored to the timechain, and you should check, at least once, just to feel it work. Challenge: if you write about bitcoin — predictions, models, takes of any temperature — stamp your work. The next cycle is coming, the genius threads will multiply, and "I called it" should cost a proof.

The clock is right there, people. It never stops, it never lies, and it notarizes for free. ⚡

---

*P.S. — Yes, this post is stamped too. The proof file is right under the zap button. Recursion is the house style.*
