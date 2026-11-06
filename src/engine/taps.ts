// A tap something on the page has already answered (a card on the home wall). Pitch mode leaves
// those alone instead of moving to the next stop.
const claimed = new WeakSet<Event>();
export const claimTap = (e: Event) => { claimed.add(e); };
export const isClaimed = (e: Event) => claimed.has(e);
