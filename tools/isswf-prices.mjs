// A module rather than JSON: the Node-free usage core cannot use a JSON import.
// Cache writes are 5-minute writes at 1.25x input; cache reads are 0.1x input unless the source lists them.
const price = (input, output, cacheRead = input / 10) => ({ input, output, cacheWrite: input * 1.25, cacheRead });

/** USD per million tokens, keyed by the exact model string recorded in transcripts. */
export const PRICES = {
  version: 1,
  source: "Anthropic first-party API prices as listed in Claude Code's claude-api reference",
  date: '2026-11-03',
  models: {
    'claude-fable-5-2': price(8, 40, 0.2),
    'claude-fable-5-1': price(10, 50),
    'claude-fable-5': price(10, 50),
    'claude-opus-5-5': price(4, 20, 0.2),
    'claude-opus-5': price(5, 25),
    'claude-opus-4-8': price(5, 25),
    'claude-opus-4-7': price(5, 25),
    'claude-opus-4-6': price(5, 25),
    'claude-sonnet-5-5': price(2, 10, 0.1),
    'claude-sonnet-5': price(2, 10),
    'claude-sonnet-4-6': price(3, 15),
    // Listed price for prompts up to 100K tokens; longer prompts are billed higher and are not modelled.
    'claude-haiku-5-5': price(0.1, 0.5),
    'claude-haiku-4-5': price(1, 5),
  },
};
