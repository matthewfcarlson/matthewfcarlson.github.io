---
title: "Honeydew"
date: 2022-11-05T15:26:00-05:00
draft: true
inprogress: true
cover:
    image: "cover.jpg"
tags:
  - 3d printing
  - webdev
  - electronics
---

I spent way too much of life avoid having to make decisions and priorities.
My wife and I have a goal to "do one thing on the house every day".
This usually means fixing baseboard, painting, adjusting cabinet doors, installing new cabinets.
It ranges from small to big tasks and looking at the spreadsheet is very overwhelming.
So work tends to happen in spurts.

At the same time, cleaning and meal planning are two areas where I need to invest the mental effort to keep track of it and plan it out, but just haven't made a focused effort.

Rather than change my ways, let's do the standard modern thing and throw technology at the problem and tell ourselves that it will solve it.

Presenting: __honeydew__

A small platform for managing house work, house cleaning, and meal planning.

## The Stack

The tech stack is actually almost entirely typescript (I really like it) and some C. You'll see where the C is in a bit.

I looked into a few options for hosting but settled on Cloudflare pages. 
I was seriously impressed by their deploy times and decent documentation.
Nuxt, Astro, and Qwik were all evaluated but ultimately I went with Vue as it's what I know.
Perhaps in the future I'll swap it out.

There are two main ways to access this: webapp, telegram, and API. 
I'll cover each independently.

## Data Storage

I'm using Cloudflare KV since their SQL database is still in private beta and I don't want to bother my one friend at Cloudflare and ask for special treatment.
So that means I need to wait in line like everyone else.
There's a decent abstraction layer over the datastore, so it should be trivial to port the system to a RDS at some point.
There are a few places that are a little wonky about how they're implemented. 

## The Webapp

## Telegram

## API

