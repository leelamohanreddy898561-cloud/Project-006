/**
 * Article bodies in Markdown (R23).
 *
 * PLACEHOLDER content, like the rest of the seed data: the content model (R13)
 * will load these from Markdown files with frontmatter. Keeping them here means
 * the detail page renders real prose today without inventing a file loader yet.
 *
 * Rendered through `marked` by src/lib/markdown.ts. The content is authored in
 * this repository, so it is trusted — no HTML sanitiser is applied.
 */

export const postBodies: Record<string, string> = {
  "mixture-of-experts": `
The largest models in production are not the largest models in the paper. A
model advertised at a trillion parameters may only touch a small fraction of
them for any given token. That gap is the whole point of
mixture-of-experts routing — and it changes what "big" even means.

## What routing actually does

A dense transformer runs every parameter for every token. A mixture-of-experts
model splits its feed-forward layers into many parallel "experts" and trains a
small router to pick two or four of them per token.

- **Capacity grows without proportional compute.** You can add experts without
  making each token more expensive to process.
- **Memory does not grow with speed.** Every expert still has to be resident.
- **Load balancing becomes a training problem.** If the router sends everything
  to a handful of experts, the rest learn nothing.

That last point is where most of the engineering effort goes. Reports of
"1 trillion parameters" usually describe total capacity, not the amount of work
done per token.

## Why it matters for cost

Serving cost tracks active parameters, not total ones. A sparse model can answer
at the speed of a much smaller dense model while drawing on far more knowledge.
The trade is memory: you pay for the whole model in VRAM even when you use a
fraction of it.

> Sparse models move the bottleneck from arithmetic to memory bandwidth. If your
> deployment is already memory-bound, routing is not a free lunch.

## What to watch

Three signals suggest whether a routing architecture is working rather than
merely present:

1. Expert utilisation stays within a narrow band across domains.
2. Quality does not collapse on rare inputs, which is the failure mode when a
   router defaults to the same few experts.
3. Latency stays flat as you add experts, which is the entire promise.

Routing is not a trick to make one model better. It is a way to spend memory
instead of compute, and that exchange rate is the thing worth measuring.
`,

  "ai-updates-october-2026": `
October was quieter than the summer, which usually means the interesting changes
were structural rather than announced. Here is what actually shifted.

## Releases

Two significant model updates shipped, both framed as efficiency work rather
than capability jumps. Context windows grew; per-token prices did not. The more
consequential release was a multimodal model that finally priced vision input
the same as text.

## Benchmark movement

The headline numbers barely moved, which is itself informative. Once models
cluster within a few points on saturated benchmarks, the rankings stop carrying
signal and the eval set becomes the differentiator.

- Long-context retrieval improved more than reasoning scores.
- Instruction-following held steady while refusal behaviour became more precise.
- Multilingual gaps narrowed in the mid-resource languages, not the low-resource
  ones.

> A benchmark that everyone has already optimised against stops measuring
> capability and starts measuring compliance with the benchmark.

## Policy

Two decisions matter for 2027. The first requires disclosure when synthetic media
is used in political advertising. The second creates a safe harbour for
security research on model weights. Neither settles the open question of
liability when an agent takes an action a user did not intend.

## What we are watching next

Agentic tool use still has no shared evaluation. Everyone measures it, nobody
measures it the same way. Until that changes, vendor comparisons will keep
describing demos rather than reliability.
`,

  "prompting-small-language-models": `
Small models are cheap, private, and fast enough to run on a laptop. They are
also unforgiving. Where a large model infers what you meant, a small one does
exactly what you said.

## Be literal

Ambiguity that a large model resolves from context is a coin flip at 3B
parameters. Say what you want, in the order you want it.

- Name the output format explicitly.
- State the audience.
- Give one example rather than describing the pattern.

## Put the instruction last

Long prompts push the instruction far from the generation point. Repeating the
instruction immediately before the response slot is the single highest-value
change for small models.

> If a prompt works on a large model and fails on a small one, the prompt is
> usually describing a goal rather than specifying a task.

## Constrain the shape

Small models drift on open-ended output. Give them a skeleton: a fixed number of
bullets, a fixed schema, a fixed vocabulary. Structure is cheaper than capability.

## Test with a fixed set

Write twenty inputs you care about and keep them. Change one thing at a time.
Without a fixed set you will spend the week tuning to whatever example you
happened to run last.

## Know when to stop

If a task needs multi-step reasoning over long context, a small model will not
get there through prompt engineering. Recognise that early and route the hard
cases to something larger rather than building an elaborate prompt that fails
intermittently.
`,

  "evaluating-llm-output": `
You do not need a research background to evaluate a model. You need a small set
of examples you trust and the discipline to keep them fixed.

## Start with twenty

Twenty inputs that represent real usage beats a thousand synthetic ones. Include
the awkward cases: empty input, ambiguous input, input in the wrong language,
input that should be refused.

## Write the expected answer

Not the exact string — the property that must hold. "Mentions both deadlines" is
testable. "Sounds good" is not.

## Separate the axes

Score correctness, format compliance, and tone independently. A response can be
right and unusable, or wrong and well-formatted. Collapsing them into one number
hides the failure mode you need to fix.

> An eval set that never fails is not measuring anything. If every run is green,
> the set is too easy or the check is too loose.

## Automate the boring part

Schema validation, length limits, required fields, refusal on prohibited
requests — all of that is deterministic and should run on every change. Save
human judgement for the cases automation cannot settle.

## Revisit quarterly

Models change under you. An eval set written for last year's model may be
measuring last year's failure modes. Keep the set, but re-read the expected
answers and retire the ones that no longer matter.
`,

  "multimodal-models-got-cheap": `
Vision used to be a premium feature. This quarter it became a default. The
practical consequence is that entire categories of work are now economically
viable that were not six months ago.

## What changed

Image input is now priced the same as text input at the major providers. Audio
understanding followed. The models are not dramatically better at vision than
they were; they are simply affordable enough to run on everything.

- Screenshot understanding without a separate OCR step.
- Document parsing that keeps layout context.
- Accessibility tooling that describes charts rather than reading them aloud
  badly.

## What this unlocks

The interesting shift is not "models can see". It is that pipelines no longer
need a detection stage, a cropping stage, and an OCR stage before the model sees
anything. One call replaces four services, and the failure modes collapse into
one place.

> Multimodal input does not remove the need for validation. It moves it: you now
> validate structured output instead of validating a vision pipeline.

## Where it still breaks

Dense tables, handwriting, and low-contrast scans remain unreliable. Handed a
receipt photographed at an angle, a multimodal model will confidently produce
plausible numbers. Treat extraction as a draft and reconcile against a total.

## The practical advice

If you maintain a separate vision pipeline, re-measure its cost this month. The
build-versus-call calculation has changed, and pipelines justified two quarters
ago may no longer be the cheaper option.
`,

  "long-context-architectures": `
Million-token context windows are shipping. The interesting question is not
whether the window exists but where the memory goes, because attention is rarely
the whole story.

## Attention is not the bottleneck

Full attention scales quadratically in compute and linearly in cache. At a
million tokens the KV cache dominates: every layer stores keys and values for
every token. That cache, not the attention math, is what forces multi-GPU
deployments.

- Grouped-query attention shrinks the cache by sharing key-value heads.
- Sliding-window layers keep only a recent band in full resolution.
- Retrieval layers keep a compressed summary of the deep past.

## The illusion of recall

A model can accept a million tokens and still fail to use the middle of them.
Recall degrades in the centre of long inputs — the same effect documented in
early long-document research.

> A large window is a capacity claim. Retrieval quality is a separate claim, and
> it is the one that determines whether the window is useful.

## How to test it yourself

Place a single fact at five positions in a long document: start, quarter,
middle, three-quarters, end. Ask for it. The difference between positions is your
real retrieval profile, and it is usually not flat.

## What it means in practice

Long context is excellent for whole-document tasks: summarise this contract, find
the contradiction between two sections. It is weaker as a substitute for
retrieval over a large corpus, where precision matters more than breadth.

The architecture race is real, but the useful question remains the same: does the
model find the fact, wherever you put it?
`,
};
