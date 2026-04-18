/** Default profile feed rank; lower sorts earlier on the home feed. */
export const DEFAULT_FEED_PRIORITY = 100;

export function isFeedSponsored(feedPriority: number | null | undefined) {
  return (feedPriority ?? DEFAULT_FEED_PRIORITY) < DEFAULT_FEED_PRIORITY;
}
