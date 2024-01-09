---
title: "How To Pick a GPU - 2024 edition"
publishDate: 2024-01-09T16:20:48-06:00
draft: true
cover:
    image: "cover.jpg"
tags:
  - opinion
---

The EVGA 3090 TI in my home desktop is great for many things and ironically one the things it was best at, I didn't like.
It was an excellent furnace and could heat up a whole room just one or two rounds of your favorite game.
With NVIDIA announcing their new cards at CES 2024, I decided that it was a good time to upgrade.
However, there are now plenty of cards and price points to pick from.
Here's the list as I see it:

- RTX 4090
- RTX 4080 Super
- RTX 4080
- RTX 4070 Ti Super
- RTX 4070 Ti
- RTX 4070 Super
- RTX 4070
- RTX 4060 Ti
- RTX 4060

By my count, that's 9 different cards with wildly different specs and prices.
Here's the specs [off of the NVIDIA website](https://www.nvidia.com/en-us/geforce/graphics-cards/compare/):

{{< table "table table-striped" >}}
|            | RTX 4090 | RTX 4080 SUPER | RTX 4080 | RTX 4070 Ti SUPER | RTX 4070 Ti | RTX 4070 SUPER | RTX 4070 | RTX 4060 Ti | RTX 4060 |
| ---        | --- | ---  | --- | --- | --- | --- | --- | --- | --- |
| Cuda Cores |16384| 10240| 9728| 8448| 7680| 7168| 5888| 4352| 3072|
| Boost Clock|2.52 | 2.55 | 2.51| 2.61| 2.61| 2.48| 2.48| 2.54| 2.46|
| Base Clock | 2.23| 2.21 | 2.21| 2.34| 2.31| 1.98| 1.92| 2.31| 1.83|
| VRAM (GB)  | 24  | 16   | 16  | 16  | 12  | 12  | 12  | 8/16| 8   |
| TDP        | 450 | 320  | 320 | 285 | 285 | 220 | 200 | 160 | 115 |
| Price      | 1599| 999  |1199 | 799 | 799 | 599 | 599 | 399 | 299 |
| Est. Price | 1599| 999  |899 | 799  | 699 | 599 | 499 | 399 | 299 |
{{</ table >}}

I've thrown in estimated price as I predict the non-super cards will be available from retailers clearing out stock for a few months as the newer cards trickle in.
Generally I just knocked $100 off MSRP.
Actual prices may vary.

We have performance numbers for some of these cards, but not all of them.
[Techspot has some nice numbers from a benchmark](https://www.techspot.com/review/2569-nvidia-geforce-rtx-4080/) of 17 games we can use.
These include Far Cry 6, Assassin's Creed Valhalla, The Outer Worlds, Horizon Zero Dawn, F1 2021, Cyberpunk 2077, and Halo Infinite.
Not the latests and greatest games but a fairly representive sample of games I actually play.

We will be looking at four stats: the average 4k fps, the 1% min fps at 4k, the 1440p average fps, and the 1% min fps for 1440p.

{{< table "table table-striped" >}}
|            | RTX 4090 | RTX 4080 SUPER | RTX 4080 | RTX 4070 Ti SUPER | RTX 4070 Ti | RTX 4070 SUPER | RTX 4070 | RTX 4060 Ti | RTX 4060 |
| ---        | --- | ---  | --- | --- | --- | --- | --- | --- | --- |
| 4K Avg     | 144 | N/A  | 111 | N/A | 59  | N/A | 55  | N/A | N/A |
| 4k 1% Min  | 116 | N/A  | 92  | N/A | 49  | N/A | 47  | N/A | N/A |
| 1440p Avg  | 215 | N/A  | 189 | N/A | 105 | N/A | 98  | 78  | 61  |
| 1440p 1%   | 168 | N/A  | 150 | N/A | 84  | N/A | 79  | 54  | 43  |
{{</ table >}}

Let's throw together a quick linear regression to predict how these cards will perform.
The weights are this:
| Attribute   | 4k Avg      | 4k 1%       | 1440p Avg   | 1440p 1%    |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| Cuda Cores  | ----------- | ----------- | ----------- | ----------- |
| Boost Clock | ----------- | ----------- | ----------- | ----------- |
| Base Clock  | ----------- | ----------- | ----------- | ----------- |
| VRAM (GB)   | ----------- | ----------- | ----------- | ----------- |

