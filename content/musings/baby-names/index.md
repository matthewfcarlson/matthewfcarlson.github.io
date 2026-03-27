---
title: "The Rise and Fall of Baby Names"
publishDate: 2026-03-26T12:00:00-06:00
tags:
  - data
  - d3
  - visualization
description: "An interactive bump chart showing how the most popular baby names in the USA have shifted from 1880 to present, using Social Security Administration data."
showtoc: false
---

Every year, the Social Security Administration publishes data on every baby name registered in the United States. The dataset stretches all the way back to 1880 — over 140 years of naming trends, fads, and cultural shifts captured in a simple list of names and counts.

I was curious about names that aren't super popular but names that are consistent.
Most people know how to pronounce and spell the name Ellen.
But you don't meet that many Ellens.
When you go to a tourist trap, you probably won't find Ellen on a cheap license plate keychain.
Additionally, when you do meet an Ellen, are they 80 or 30?
You probably don't know.

Are there names like this that:
- Aren't incredibly common, but common enough that people know them
- Don't have a specific time period tied to the name

The data isn't merged extensively (ie, we say that william and will are the same name).
There are techniques for merging these by converting them to syllables. But I can't be bothered.

## The Chart

Search for any name, or pick a preset to explore different eras. Hover over a line to see details, click to pin it. The Y-axis shows rank (1 = most popular).

{{< typescript src="bump-chart.ts" id="bump-chart" >}}

## The Timeless Names

Some names are fads with spikes.
But others are remarkably stable across generations.
If someone tells you their name is "Kyle," you can probably guess they were born in the '90s. There are even memes about it on the internet.
But some names give away nothing. 

The chart below shows the names with the flattest rank trajectories — the ones where knowing the name tells you almost nothing about when the person was born.

Here is how I have chosen to calculate the score.

`score = std + (worstRank - bestRank) * 0.5`

{{< typescript src="flat-names.ts" id="flat-names" >}}

## What the Data Tells Us

**The Jennifer Effect.** Some names explode onto the scene and dominate for a decade before fading just as fast. Jennifer went from obscurity to #1 in 1970 and stayed on top for over a decade — then fell off a cliff. The same pattern repeats with Jessica in the late '80s and Ashley in the '90s.

**Biblical names endure — until they don't.** Mary held the #1 spot for girls from 1880 to 1946 — an astonishing 67-year reign. James and John dominated the boys' charts for nearly a century. But since the 2000s, even these stalwarts have slipped as parents increasingly seek distinctive names.

**The diversity explosion.** In 1950, the top 10 names accounted for a huge share of all babies. Today, naming is far more distributed. There are more names in the top 200 that weren't there a decade ago. We're in the most diverse naming era in American history.

**Pop culture leaves fingerprints.** You can spot cultural moments in the data: Shirley (Temple) in the 1930s, Elvis never quite cracking the mainstream, Arya climbing after Game of Thrones. Names are a mirror of what a generation was watching, reading, and listening to.

**Male name tends to be more stable.** Looking at the most stable names, they are overwhelmingly male names. Top names tend to stay top names for long long times.

---

*Data source: [Social Security Administration](https://www.ssa.gov/oact/babynames/). Only names with at least 5 occurrences in a given year are included in the SSA dataset.*
