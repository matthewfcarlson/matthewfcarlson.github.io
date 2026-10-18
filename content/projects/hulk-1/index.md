---
title: "Decompiling The Games I Loved"
#date: 2026-10-15T21:33:08-05:00
publishDate: 2026-10-17T22:52:05-05:00
draft: false
inprogress: false
cover:
    image: "Gemini_Generated_Image_jwqezxjwqezxjwqe.jpg"
tags:
  - ai
  - gaming
  - assembly
---

"What would the world look like if everything was open-source" is a common refrain I've heard lately.
Projects like [reverse engineer anything](https://github.com/morluto/rea) that offer AI skills and tools that can turn any shipped binary into actual code.

While I think that is somewhat true and will become even more true over time, we aren't entirely there yet.
But it clear that the world has turned upside down in the last few months and not everything has fallen out yet.

I tried to decompile a game to test that.

There are many other articles out there such as [this guide about N64 from 2025](https://blog.chrislewis.au/using-coding-agents-to-decompile-nintendo-64-games/) or a [more recent one about a certain first person shooter](https://momo5502.com/posts/2026-10-09-game-decompilation/) that was taken down for copyright reasons.

I will try to add to the discourse rather than echo what has already been said.

## Disclaimer

> This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by or sponsored by Marvel, The Walt Disney Company, Radical Entertainment, Vivendi Universal Games, Activision or Microsoft. "The Incredible Hulk", "Hulk", "Marvel" and all related names, characters and marks are trademarks of their respective owners and are used here only to identify the game this project is compatible with. The blog post and the repository contain no executables, data or assets from the original release; to use it you need your own legally obtained copy of the game. Nothing here is offered for sale.

## Getting started

I started with [Hulk Ultimate Destruction](https://en.wikipedia.org/wiki/The_Incredible_Hulk%3A_Ultimate_Destruction), which was one of my favorites.

![hulk game](hulk_ultimate_destruction_packaging-1805096330.jpg)
You can rip cars in half and use them as boxing gloves.
Punch buildings so hard they fall down.
Fly through the air or clap so hard the world explodes.

I had started a variation of this project a year or two ago.
The rough idea was to hoist the game into an emulator environment (often known as recomp) where it would run as a background process.
Then just render new graphics on top using tracked memory locations to inform the state of all the objects in the game, similar to how they remastered the older Halo games.
I ultimately scrapped it, since it's basically writing a brand new game that derives the game logic from a complex black box.

Going into this project, I started with a local Qwen model (Qwen3.6-35B-A3B) running on an older macbook and a $20/mo claude plan.
I really thought that local models would be able to do it all, but I was quite wrong.

## How Decomps Work

The basic idea of a decomp is you run a program like [ghidra](https://github.com/NationalSecurityAgency/ghidra) (a decompiling tool from the NSA of all people) that takes in assembly and turns it into very very terrible C.
It tries to identify functions, classes, vtables, and the like.

Xbox games are x86 because the console runs on a Pentium 3-class CPU, so you start with assembly like this:

```asm
sub   esp, 0x8
mov   eax, [esp+0xc]
push  ebx
mov   ebx, [esp+0x14]
push  ebp
push  esi
mov   esi, eax
movzx ebp, ah
and   eax, 0xff
mov   [esp+0xc], eax
movzx eax, bh
sub   eax, ebp
push  edi
movzx edi, byte ptr [esp+0x1e]
mov   [esp+0x1c], eax
mov   [esp+0x14], ecx
shr   esi, 0x18
fild  dword ptr [esp+0x1c]
fmul  dword ptr [esp+0x24]
call  __ftol
...
add   eax, esi
...
or    ebp, eax
mov   eax, [esp+0x14]
mov   [eax], ebp 
...
ret   0xc
```
> Note: for this particular example, the assembly shown here does not come from the hulk game but is an example I made up.

Which ghidra turns into terrible c:

```c
void __thiscall FUN_00011750(uint *param_1,uint param_2)
{
  int iVar1, iVar2, iVar3, iVar4;

  iVar1 = FUN_0034483c();
  iVar2 = FUN_0034483c();
  iVar3 = FUN_0034483c();
  iVar4 = FUN_0034483c();
  *param_1 = (iVar1 + (param_2 >> 0x10 & 0xff)) * 0x10000 | (iVar2 + (param_2 >> 8 & 0xff)) * 0x100
             | (iVar3 + (param_2 >> 0x18)) * 0x1000000 | iVar4 + (param_2 & 0xff);
}
```

The goal is to turn it into something like this:

```c++
struct ColorRGB888 {
 unsigned int value;
 void lerp(unsigned int from, unsigned int to, float amount);
};

void ColorRGB888::lerp(unsigned int from, unsigned int to, float amount) {
 int red = (from >> 16) & 255;
 int green = (from >> 8) & 255;
 int alpha = from >> 24;
 int blue = from & 255;
 unsigned int result = (unsigned int)(red + (int)(((int)((to >> 16) & 255) - red) * (double)amount)) << 16;
 result |= (unsigned int)(green + (int)(((int)((to >> 8) & 255) - green) * (double)amount)) << 8;
 result |= (unsigned int)(alpha + (int)(((int)(to >> 24) - alpha) * (double)amount)) << 24;
 result |= (unsigned int)(blue + (int)(((int)(to & 255) - blue) * (double)amount));
 value = result;
}
```
It's now obvious that this is a color lerp (linear interpolation) for an RGB888 color space.

The goal is to take in the assembly, the C, and any context, and spin out C++ that we compile and prove matches the assembly exactly.

Once you have every function matching exactly, you have a good starting point to rebuild it for other platforms, start making tweaks like skipping cutscenes, rewriting shaders, or adding new missions.

## How AI Does It

The [pi-durable](https://earendil.com/posts/pi-durable/) seemed perfect for this kind of thing where it can spin up resumable conversations to try on each match.
After collecting a copy of the iso, I analyzed the binary and realized there were roughly 27,477 functions I needed to match.
That number was different when I started because ghidra sometimes gets confused about where functions start and end, especially with inlining.

Showing that this is something you can do without an expensive cloud subscription was a goal and so I started with Qwen3.6-35B-A3B.
The performance of the local model on the macbook was 45 t/s with a fairly terrible match rate.
Switching to Deepseek v4 was much better but it generated a measly 1-4 matches an hour due to the super slow tokens per second (5-6t/s is what my records say but that seems super slow).
But it matched about 75% of the time locally (89% on the cloud version), rather than Qwen's ~45%.
Assuming an average of 2.5/hour that's 457 days straight of running a model.
Assuming we keep up with the pace of the past few months, dozens of new better models would come out in that time frame.

I tried a few other local models (a bigger 180B Qwen3.8-Flash-Next, a 2-bit 27B Ternary-Bonsai, and Gemma 4 12B) but ran into similar issues where if they were smart enough to solve it, they were too slow to be useful.
Despite my principles, I needed help.

## Putting Money Where My AI Is

My next step was to put $20 into OpenRouter and have the farm start making cheap matches.
However, when you have 27,477 functions to match, if each one costs on average $0.01 that's $274.
And some of them are 1000s of instructions long, which means it's going to be way more $0.01.

The AI made a decent chunk of progress quickly with GPT-Luna, GLM 5.3 Flash, and Deepseek v4, but the cost was quickly rising to a level I personally was not happy with.
Twenty USD was probably going to be a limit I was happy with.
I have a spouse and a family and justifying "you spent how much on AI to do what" didn't feel like a particularly defensible position.
A friend of mine mentioned paying for tokens directly was probably the least cost effective thing I could do; a subscription is almost always going to be cheaper per token.
So, with an OpenAI subscription and an Anthropic subscription in hand, I was ready. (I later upgraded to the next tier of claude once usage limits became the bottleneck.)
I plugged it into pi so pi-durable could pick it up.

I started Oct 8th and had 12k of ~23k functions matched on the first day.
That sounds great until you realize they were mostly tiny ones, only about 12% of the game's bytes.

## Fine Tuning

The upside of using OpenRouter is we had examples with reasoning that we could use to fine-tune a model.
So instead of running a local model on the laptop, I used unsloth to fine-tune Qwen which claude dubbed ulk-1. 

This was a clear improvement but clearly wasn't a winner, only getting to ~50% pass rate.
The later version ulk-2 added equivalence (more on that later) and data from other x86 decomp projects I found on github, improving the accuracy up to ~65%.
However, it completely fell apart on larger/longer functions with a near-0% success rate on any function over 100 bytes long.

I had longer matches thanks to OpenAI but no reasoning to give the AI.
Asking AI to provide reasoning often ran afoul of reason extraction guardrails and I had to phrase what I wanted very carefully.
The reasoning suffers from a few biases and using AI output to fine tune a model may be against terms of service, I'll have to look. 
These formed the basis of ulk-3, which got 68 of my 93 test functions (~73%) with way fewer tries, but still falls apart on anything bigger (0 of 50 on 128-255 byte functions).

The overall setup has the local model chewing through the backlog and anything it doesn't get after a few tries goes to a smarter model.
If the slightly smarter ChatGPT subscription can't solve it, we wait for claude.

Rather than having sonnet/opus solve each item in the queue, we have it identify what the common thread is.
Adding that hint to the context often gave these small models what they needed to create a match.

## Shortcuts and Throwing Compute At It

Matching larger functions gets harder and harder, so the AI proposed an alternative: proving functions as equivalent.
Assembly is lots of register swizzling and stack magic. If a function does x, y, and then returns z does it matter if it does x or y first?
Sometimes, but plenty of times no.

Rather than try to match perfectly, it built a fairly complex tool set it called equivalence.
It's sort of a mix between a fuzzer and a tester.
When proving a function as equivalent, it needs to produce the same effects (same calls in the same order, same memory writes, same return value) as the original in a simulated x86/x87 system, across a large number of inputs with a large amount of coverage.
Similar to a fuzzer trying different inputs, it wants to see all the various paths and jumps get exercised.

The other helpful piece was a hybrid build where it could patch functions into the game, load it in an emulator with a breakpoint set, check to make sure it got the right input/output and whether that matched the original binary exactly.
This meant patching functions to remove all sources of randomness, which was easy: I just asked and claude did it.
Without any randomness, I could play the game for up to ~10 minutes and have a decent snapshot to replay as we proved more and more functions as equivalent.

Some errors slipped through and it was helpful to throw the checker on another machine I had lying around to do 4-5x more inputs than my local mac was doing.

I reached 100% verified on the 17th, 9 days later.
These sorts of projects used to take a group of volunteers years.
And I did most of it by directing claude from my phone and spending money.

## Helpful notes

1. Recipes are better than retries. It's worth it to spend one strong-model investigation on a group of problems, write the fix into the brief, then scale with cheap models and scripts. Often understanding how a vtable pointer or compiler quirk works unlocks hundreds of functions.
2. Match models to size. Cheap models (Luna) work up to about 96 B. Sonnet works for 97–192 B. Past that, the problem is capacity, not feedback.
3. Restarts beat long chains. Matches level off after about 5 attempts, and two independent 4-attempt runs beat one 8-attempt run.
4. Aligned diffs are much better than regular diffs for AI context.

## Why Do It?

There are easier ways to play an old game you love.
An old xbox at the retro game store by my house is $50 and you can find a copy of a disk on your favorite auction sites for $5-10 USD.
You can obtain a legal copy of a game iso and play it on an xbox emulator (this project leaned heavily on xemu).
There are projects that recompile games like [XenonRecomp](https://github.com/hedge-dev/XenonRecomp) which re-compiles xbox360 games into c++.
They are effectively hoisting the VM into the code itself as it maintains PowerPC CPU state as a variable into functions.
Games still remain an opaque black box.

To butcher an old allegory by a Greek guy, imagine the game as being a cave where what you play is just the shadows projected on the wall.

![photo of people in a cave watching shadows on the wall where the shadows are popular gaming characters](cave_image.png)

The reality is that we almost never can leave the cave and see what is actually casting the shadows.
These are proprietary projects with IP and copyright and lawyers.
But we can explore the cave and see the hints of what was.

It is awesome to look through games I loved and see how the developers put them together.
A few things I found:

- **Radical left RTTI on.** RTTI (run-time type information) is metadata C++ keeps so it can do things like `dynamic_cast`. It means the shipped binary still carries the names of about 4,200 classes, their inheritance, and their virtual functions. That was the single biggest free win of the project.
- **The game already does 720p and 16:9.** I assumed it was hard-coded to 640x480, but it asks for up to 1280x720 and has a mode table that goes up to 1080i, picking the best one the console's video settings allow. Widescreen is built in.
- **The missions are scripted in Lua, but not quite the Lua you'd expect.** The VM calls itself `Lua 5.1 (work)`, yet the bytecode is the older Lua 5.0 layout with the version byte changed. Why did they go for 5.1? The Lua team didn't officially release it until 2006 (a few months after the game shipped in 2005), so Radical was apparently running a pre-release snapshot.

There's something to be said about the difference between crawling through the cave yourself vs sending a robot in to look and tell you what it found.
I will let you personally decide where you land in that particular debate.

## Can I Do It?

I work as a firmware engineer and have spent a decent amount of time staring at assembly to try and figure out what is going on.
Every once in a while I have to write a small snippet of assembly for performance or bootstrapping reasons (i.e., the code to set up main).

While I feel confident about having to roll up my sleeves and jump in there if needed, I never had to.
I had a single claude session coordinating the whole thing (the farm, the subagents, the other models) through dozens of conversation compactions.
While there were a few times I pointed out flaws or things it had overlooked, for the vast majority of the time I found myself agreeing with the clanker about the next item on the list to tackle or even how to tackle it.

So yes. While it isn't "press button and game pops out" it also isn't "toil for months or weeks or days".
That bar will only get lower and lower as time goes on.

## Where Do We Go From Here?

The recent post on [decomp.dev](https://decomp.dev) written by [@encounter](https://github.com/encounter) puts it quite nicely.
> It is now clear that, with the right guidance, human input, and code reviews, AI can expedite the decompilation process in a significant way. What is also now clear is that the community aspect of decompilation has been broken

> decomp.dev was originally designed to gamify decompilation: watching the progress go up was a fun way to stay motivated when every fraction of a percent took real human effort. Today, that same idea has warped decompilation into a hollow numbers game, exacerbated by folks who just want to burn tokens to make number go up or "port game to PC", all else be damned. 

It's clear that we are in a new era.
For me personally, I have a few more games to decomp so I can play with my brother again.
