---
title: "Fighting Distraction With Unit Tests"
publishDate: 2023-01-21T21:20:19-06:00
cover:
    image: "ferenc-almasi-EWLHA4T-mso-unsplash.jpg"
tags:
  - opinion
  - development
  - unit tests
  - productivity
  - programming
---

While I won't go so far as to diagnose myself with ADD without consulting a doctor, those who know me know I can be distracted quite easily.
So recently, I decided to do something a little different with a personal project I started a few weeks ago (link to come).

> I wrote unit tests.

That may seem rather uninspired, but I've always poo-pood the idea of test-driven development (TDD), as it seems wild to me to write a test for something that you don't know what it needs to do yet.
It works great when there's a well-defined spec or an existing hole that you need to fit.
TDD shines when refactoring a codebase. Treat it as a black box, document and validate the behavior, and start rebuilding the inside.

However, when you're cobbling together a project from scratch, iterating and hacking away until something decent works, writing test code to throw it all away seems like a waste.

While not traditional TDD or likely not a new concept, I've done something I've dubbed TLD (Test Led Development).
Rather than writing a whole smattering of tests and then coding until they all pass, TLD focuses on ping-ponging between test and code.
First, you write the function header/prototype and then go and write a quick test that exercises it reasonably well.
Then code the function, ensure the test case passes, and split it if needed.

This approach had an unexpected advantage.

I started ending a coding session after writing a test and leaving the implementation for the next time.
Later, I would sit down at my desk and try to decide what I wanted to do.
Often I would do surface-level tweaks and little changes on a few projects without making significant progress on anything.
When you haven't worked on a project in a little while, it can be hard to remember what you were thinking to do next.
A TODO document or project tracker may help page that context back in, but I haven't found a system that triggers that recall I'm looking for.

The broken unit test stuck out like a sore thumb.
I would tell myself to fix the unit tests and then go back to looking at other projects.
By implementing the function, I could remember more about the codebase and where I wanted to go next.
Time flew by in a blissful flow as I implemented new features, and the number of unit tests climbed higher.

Find a bug? Write a test that exercises that path.
Then bang on it until all tests pass.

It might go against your engineering sensibilities, but for personal projects, I'd encourage you to check in code with a single failing unit test.

