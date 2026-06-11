---
title: "Your zaps are probably broken (mine were)"
subtitle: "The 60-second checkup nobody does, and the fix that ends it forever."
date: 2026-06-11
block: 953194
---

Earlier this week I was doing some boring plumbing on my website when I found a corpse in the walls.

For months — honestly, I don't know how long — every single person who tried to zap me got nothing. No error worth reading, no bounced payment, no "hey, RadVladdy's address is dead, somebody tell him." The sats just never left their wallet. My tip jar wasn't empty; it was *bricked*. And here's the part that should bother you: there is no system anywhere in Nostr, Lightning, or the laws of physics that would ever have told me.

I only found it because I happened to be rebuilding my site and decided to check the pipes while I was in there.

So, before you read another word: when did *you* last test your zaps? Not "post and hope." Actually test them. If the answer is "never," this essay might be about you. Let's find out.

## The note taped to your door

That lightning address in your profile — `you@something.com` — feels like a wallet. It isn't. It's a note taped to your front door that says "knock here."

When someone zaps you, their wallet reads your profile, finds that address, and converts it into a URL — `https://something.com/.well-known/lnurlp/you` — and knocks. Your provider is supposed to answer with a small JSON note: *here's how to pay this person, here's the minimum and maximum, and yes, zap receipts are welcome here.* The payer's wallet then asks for an invoice and pays it. The whole dance takes about a second and nobody ever sees it.

Which means the address in your profile is only as alive as the server behind it. The profile field is set-and-forget. The plumbing behind it is not.

## The autopsy

Here's what my pipes looked like when I finally opened the wall.

My profile said `radvladdy@nostrplebs.com`. I set that years ago and never thought about it again.

Knock one: nostrplebs answered — but only to say "not my problem anymore, go ask getalby." That's a redirect, and a redirect is already a coin flip: the spec that defines lightning addresses doesn't require wallets to follow them, and plenty don't. For some portion of my would-be zappers, the payment died right there.

Knock two, for the wallets that did follow: getalby answered **404 — nobody by that name lives here.**

That name *used* to be mine. Somewhere along the way I renamed an old account during a cleanup, the way you'd rename a folder. Nothing warned me that services across the internet still pointed at the old name. The chain had quietly become: a forwarding note, pointing to a forwarding note, pointing to a door that no longer exists.

Nobody lost money — no invoice means the payment never even starts. What I lost was every zap anyone ever tried to send me. And something more expensive: every one of those people concluded, reasonably, that zapping me doesn't work. They won't try twice.

## Why your pipes are probably leaking too

My failure took two services and one careless rename. Yours might need even less:

- Your address lives at a third-party service, and that service rebranded, got acquired, changed its rules, or quietly died. The lightning-address-provider graveyard is bigger than you think.
- You migrated wallets and updated everything *except* the profile field.
- You renamed an account somewhere. Ever.
- Your provider changed your handle's endpoints and assumed you'd notice.

Address rot isn't an edge case. It's the default fate of any string that points at someone else's server. And the cruel part is the silence: a broken website *looks* broken. A broken lightning address looks exactly like a working one, right up until somebody tries to pay you.

## The 60-second checkup

Do this now. It's genuinely one minute.

1. Open your Nostr profile and copy your lightning address. Say it's `you@example.com`.
2. Turn it into a URL: `https://example.com/.well-known/lnurlp/you` — and open that in any browser.
3. You want a wall of JSON that includes `"tag": "payRequest"`. (Bonus: if it says `"allowsNostr": true`, zap receipts work too.)
4. Red flags: a 404, an error page, anything about redirecting, or HTML where JSON should be.
5. Final exam: zap yourself 21 sats from a second account or a friend's phone. JSON can lie about the last mile. Sats can't.

Repeat after any rename, any migration, any provider drama — and quarterly otherwise. It's a smoke detector. You test it *before* the fire.

## The fix that ends this forever

The checkup finds the leak. Here's what ends the entire class of problem: **stop letting other people own your string.**

My address is now `rad@radvladdy.com`. My domain. Behind it sits the dumbest piece of infrastructure I own: a forty-line Cloudflare Worker that does nothing but pass the payment handshake through to whatever backend I currently use. Today that's an ecash-backed address that can receive sats while my phone is dead in my pocket. Next year it might be my own node. When I swap, I change one line in a file I control — and the address the world knows me by never changes again.

The same domain serves my Nostr identity (NIP-05) from a static file sitting right next to it. Identity and payments: one string, two pipes, zero third-party names left in my profile.

The whole thing is open source in [my site's repo](https://github.com/RadVladdy/radvladdy-site) — the worker, the static files, all of it. Steal it. If you can point a domain at Cloudflare, you can own your string by this weekend.

## Check the pipes

We tell people sovereignty is the heroic stuff — running a node, multisig ceremonies, steel plates in a mountain vault. Mostly it is. But some of it is just being the kind of person who checks their own plumbing. Because nobody else can.

There's a zap button under this post. If it works, I'll know my pipes are clean.

If yours doesn't — well. Now you know what your weekend looks like. ⚡

---

*P.S. — I drafted this the same day I found the corpse. The repo with the worker recipe is linked from the projects page.*
