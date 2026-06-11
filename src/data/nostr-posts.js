// slug → nostr pointer (naddr / nevent / note1) for essays cross-posted to
// nostr as NIP-23. An entry here lights up the ~/comments section on that
// essay's page — replies and zaps render live from the relays.
//
// This map lives OUTSIDE the essay files on purpose: the markdown in
// src/content/writing/ is OpenTimestamps-stamped and immutable, so the
// nostr pointer must never be added to a post's frontmatter after the fact.
// Add a line here on each drip day instead.
export default {
  // 'your-zaps-are-probably-broken': 'naddr1…',
};
