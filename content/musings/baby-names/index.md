---
title: "How flat is your name?"
publishDate: 2026-03-26T12:00:00-06:00
tags:
  - data
  - d3
  - visualization
description: "Finding the flattest baby names"
showtoc: false
---

Every year, the Social Security Administration publishes data on every baby name registered in the United States. The dataset stretches all the way back to 1880, covering over 140 years of naming trends, fads, and cultural shifts captured in a simple list of names and counts.

I was curious about names that aren't super popular but are consistent.
Most people know how to pronounce and spell the name Ellen.
But you don't meet that many Ellens.
When you go to a tourist trap, you probably won't find Ellen on a cheap license plate keychain.
And when you do meet an Ellen, are they 80 or 30?
You probably can't tell.

Are there names like this that:
- Aren't incredibly common, but common enough that people recognize them
- Don't have a specific era tied to them

One note: the data isn't merged extensively. William and Will are treated as separate names.
There are techniques for merging variants by converting them to phonemes, but I can't be bothered.

## Why rank?

The SSA data includes raw counts: how many babies were given each name every year. But raw counts and percentages are misleading for comparing across eras.

In 1880, roughly **8% of all male babies were named William**. Today it's closer to **1%**.
William is still incredibly popular (it has never left the top 20) but over the past 150 years parents have diversified dramatically.
The total pool of names in use has exploded, so every individual name's slice of the pie shrinks regardless of how popular it actually is relative to other names.

Rank sidesteps this. It measures *relative* popularity: is this name #1, #10, or #100 compared to everything else that year? The charts below show the difference.

{{< typescript src="why-rank.ts" id="why-rank" >}}

Same name, two lenses. Left: William's raw share of male births, which looks like a long steady decline driven by naming diversity, not a real drop in popularity. Right: William's rank, near the top for over a century.

## The Chart

Search for any name, or pick a preset to explore different eras. Hover over a line to see details, click to pin it. The Y-axis shows rank (1 = most popular).

{{< typescript src="bump-chart.ts" id="bump-chart" >}}

## The Timeless Names

Some names are fads with spikes.
But others are remarkably stable across generations.
If someone tells you their name is "Kyle," you can probably guess they were born in the '90s. There are even memes about it on the internet.
But some names give away nothing. 

The chart below shows the names with the flattest rank trajectories: the ones where knowing the name tells you almost nothing about when the person was born.

Here is how I have chosen to calculate the score.

`score = std + (worstRank - bestRank) * 0.5`

{{< typescript src="flat-names.ts" id="flat-names" >}}

## The Hidden Middle

This brings up my next question.
Many of the "flat" names are quite popular, which isn't what I'm trying to find.
What about the second string names? 
Staying in the middle band, decade after decade, never quite fading to obscurity.

The chart below ranks names by a combination of low standard deviation and lower average rank, steady *and* relatively popular within the 50–2,000 band.
We filter out anything that ever peaked above rank 50, and anything that ever dropped below rank 2,000.

`score = std_dev × 3 + avg_rank`

{{< typescript src="steady-names.ts" id="steady-names" >}}

## What the Data Tells Us

**The Jennifer Effect.** Some names explode onto the scene and dominate for a decade before fading just as fast. Jennifer went from obscurity to #1 in 1970 and stayed on top for over a decade before falling off a cliff. The same pattern repeats with Jessica in the late '80s and Ashley in the '90s.

**Biblical names endure, until they don't.** Mary held the #1 spot for girls from 1880 to 1946 (67 years). James and John dominated the boys' charts for nearly a century. But since the 2000s, even these stalwarts have slipped as parents increasingly seek distinctive names.

**The diversity explosion.** In 1950, the top 10 names accounted for a huge share of all babies. Today, naming is far more distributed. There are more names in the top 200 that weren't there a decade ago. We're in the most diverse naming era in American history.

**Pop culture leaves fingerprints.** You can spot cultural moments in the data: Shirley (Temple) in the 1930s, Elvis never quite cracking the mainstream, Arya climbing after Game of Thrones. Names are a mirror of what a generation was watching, reading, and listening to.

**Male names tend to be more stable.** Looking at the most stable names, they are overwhelmingly male. Top male names tend to stay at the top for a very long time.

---

*Data source: [Social Security Administration](https://www.ssa.gov/oact/babynames/). Only names with at least 5 occurrences in a given year are included in the SSA dataset.*
