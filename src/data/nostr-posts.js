// slug → nostr pointer (naddr / nevent / note1) for essays cross-posted to
// nostr as NIP-23. An entry here lights up the ~/comments section on that
// essay's page — replies and zaps render live from the relays.
//
// This map lives OUTSIDE the essay files on purpose: the markdown in
// src/content/writing/ is OpenTimestamps-stamped and immutable, so the
// nostr pointer must never be added to a post's frontmatter after the fact.
// Add a line here on each drip day instead.
export default {
  'your-zaps-are-probably-broken': 'nevent1qvzqqqqqqypzq7fnagdtmvefzwd5avm32ajfy2d5r59wg3vswgutq7fxrqhhz7fyqqsdkg4qpv544344s6dn52uudnqf0f7hynye4thshlgwaxajrn0ys5g4sne7w',
  'i-rebuilt-my-web-presence-in-one-day': 'nevent1qqs2uzsjgwxkrn2s76f7utttkqkn59ce3fv9pfndxsr4df67042kjfcpr4mhxue69uhkummnw3ezucnfw33k76twv4ezuum0vd5kzmp0qgs8jvl2r27mx2gnnd8txu2hvjfzndqaptjytyrj8zc8jfsc9achjfqrqsqqqqqp2n4lxm',
};
