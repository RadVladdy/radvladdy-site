---
title: "I built the same feature twice (on purpose)"
subtitle: "Reader highlights on timechain.wiki run on both Nostr and Pubky. Here's what building it twice taught me about owning your margins."
date: 2026-08-10
block: 961954
---

The best thing about a used book is arguing with a stranger.

You know the experience: you're forty pages into some secondhand paperback and there it is — a pencil underline from a previous life, with *"no!!"* jammed in the margin. Somebody read this exact sentence, maybe decades ago, and had *feelings*. For two dollars you got the book and a tiny séance.

Now try to name the digital version. You highlight constantly — in reading apps, in e-books, in whatever's left of your attention span — and none of it survives contact with time. The notes live in some company's database, attached to an account, behind a login. The company pivots or dies or bans you, and your marginalia goes wherever deleted things go. And a stranger finding your underline in fifty years? There's no product manager alive who'd let that happen on purpose.

I run timechain.wiki, a free Bitcoin encyclopedia — 394 entries you can walk through like a library, from "what is money" down to the protocol plumbing. An encyclopedia is exactly the kind of book people should argue with. So I built highlighting into it: select a passage, save it, add a note if you've got one, keep it private or share it publicly for other readers to find — the pencil-in-a-used-book experience, on the web, on purpose.

And when it came time to decide where those highlights should *live*, I refused to pick a side. I built it twice — [once on Nostr](/nostr/naddr1qvzqqqr4gupzq7fnagdtmvefzwd5avm32ajfy2d5r59wg3vswgutq7fxrqhhz7fyqyxhwumn8ghj7mn0wvhxcmmvqyt8wumn8ghj7un9d3shjtnswf5k6ctv9ehx2aqq93uk7atj945xjemgd35kw6r5wvkhx6r0w4kxgmn594kxjan9945kuttd0ykkgct5v93xzum9a6kh7e), [once on Pubky](https://pubky.app/post/o6efkc1ykzf9g45c83bmfa5tyeni5gxjdqokdxpxf74r8c4w7cky/0035HF9Y41X3G). Partly because I believe in both. Mostly because the two of them answer the same question so differently that building both taught me more than any comparison chart ever could.

The question is: **where should your stuff be?**

**The Nostr answer: everywhere**

Nostr's model is broadcast. Your identity is a keypair; everything you create is a little signed message, published to relays — cheap, interchangeable servers that pass notes around. Sign in to my site with your Nostr key (a browser extension, or a signer app like Amber — the site never touches the key itself) and every highlight you make becomes a signed event on *your* relays.

Credit where it's due: I didn't invent any of that. A developer named Pablo Fernandez — pablof7z to the network — built an app called Highlighter that turned the humble highlight into a standard the whole network shares, the way email is a standard. My site inherited it the way you inherit any good commons: freely, gratefully, without asking permission.

What broadcast buys you is *reach*. Your underline isn't a timechain.wiki feature; it's a public object any Nostr app can render. People can reply to your marginalia. They can zap it — send it a tip in Bitcoin — which means somewhere out there, a margin note of yours can quietly earn more than the book did. And discovery is free: the site just listens to the network and the highlights of readers I've never met show up on my pages like pencil ghosts in a used book.

The trade: public means *really* public. Anyone can index it. Deletion is a polite request. And your stuff isn't in a *place* — it's a flock of copies scattered across relays that keep it alive by redundancy, not by promise.

**The Pubky answer: at home**

Pubky's model is homesteading. Your identity is still a keypair, but your data lives in one place you choose — a homeserver — as real files in real folders you control. Sign in to my site with Pubky Ring (scan a QR; your phone shows exactly which folder the site may touch, and the key never leaves the phone) and every highlight becomes a small file in *your* folder, on *your* server.

What homesteading buys you is *locality*. Your marginalia has an address. Move homeservers and it moves with you — the Pubky folks call this the credible exit, and it's the soul of the whole design. If my site vanished tomorrow, your highlights wouldn't notice. And discovery is opt-in at the level of physics: there is no firehose on Pubky, no way for my site to scan the world for highlights. My crawler can only visit readers who deliberately placed a little marker file in their own folder — a marker only they can write, because only they hold their key. Nobody can opt you in, and opting out is deleting one file. On Nostr, "don't index me" is etiquette. On Pubky, it's architecture.

The trade: Pubky is younger. Its private storage is still alpha — hidden from the public, but not yet encrypted, and the team says so plainly instead of pretending otherwise, which is exactly the honesty you want from people holding your data. (Nostr's private mode, meanwhile, is properly encrypted today — my site's private highlights on that rail are ciphertext even to the relays carrying them.)

**So which one should you use?**

Here's the folksy truth: I don't care, and that's the point.

One of them treats your thoughts like radio — sign them, broadcast them, let redundancy keep them alive. The other treats them like a homestead — file them on your own land, decide who visits. Those are both *correct* answers to "where should your stuff be," optimized for different fears. Reach versus roots. And you don't have to choose: the site lets you sign in with both at once and pick a destination per highlight, and if you publish to both rails it links the records so you show up as one person, not two strangers.

What I actually care about is the thing both answers refuse: neither one puts your margins in *my* database. I couldn't read your private notes or seize your public ones if I tried, and I built the thing. That's new. That's the whole experiment.

Fifty years from now, nobody's going to find your underlines in a company's database — the company won't exist, and neither will the database. But a signed event replicated across relays, or a file on a server you own, carried from homeserver to homeserver like a box of books to a new house? A stranger might just find those. Might even scribble *"no!!"* next to them.

Go argue with a sentence. On whichever rail feels like yours.
