---
title: "Voroni"
date: 2022-06-17T10:25:51-05:00
draft: true
inprogress: true
cover:
    image: "cover.jpg"
tags:
 - python
 - GPU
#  - webdev
---

I recently came across [this blog post](https://www.rykap.com/graphics/skew/2016/02/25/voronoi-diagrams/). 
Particularly there was a demo where you control a single point in the underlying canvas and other points move past. 
It creates an interesting effect. 

A few years ago, I tried to take the code that powers the [fantastic app Primitive](https://primitive.lol) and use it to produce videos. 
It took a long time as each frame took a few seconds and the I was trying to compare to the previous frame as well the as the reference frame. 
Additionally the resulting output was hard to watch. So I had to turn the polygon count way up to make it watchable, losing the cool effect.

![old output](old_output.gif)