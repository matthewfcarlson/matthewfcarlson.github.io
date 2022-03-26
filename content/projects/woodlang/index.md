---
title: "Introducing Woodlang"
date: 2022-03-26T13:11:12-05:00
draft: true
cover:
    image: "cover.jpg"
tags:
#  - woodworking
#  - webdev
- woodworking
- woodlang
- programming
---

## A node-based programming language for woodworkers

Instead of describing the shape you wish to produce, describe the steps to make a specific shape. 
Nodes such as miter cuts, dowel join, biscuit join, plane, route, and other woodworking operations all you to create the parts needed.
Build steps are not an afterthought of a design but the design itself.
Plans are easy to export and tweak.
Additionally, they can easily be modified to use the tools available in a specific shop.
The plans can be checked for buildability to make sure that it can actually be built and assembled.

The [github repo is here](https://github.com/matthewfcarlson/woodlang).

### Why?

I love woodworking and programming. 
Previously when planning a furniture build I would use sketchup to create accurate measurements.
However, there a few problems with this. 
Just because you can model something doesn't mean it can be made easily.
Since sketchup is not a solid modeling system, it makes it easy to snap faces and edges together but you can have parts intersect and not know you have a problem.
OpenSCAD is a powerful option with huge customization and parametricity but doesn't really lend itself well to quick iteration or certain tasks.

## Current Status

Currently I just have simple prototypes so I'm writing this post as a way of motivating myself and collecting feedback.
I started with a python prototype but it disliked having to chose between chaining and ownership.
Chaining makes it so you can easily do something like this:
```python
table_leg.rip(Inches(2 + 3/16)).miter(Inches(65)/5).bevel(edges=['TL','TR','BL','BR', bit=Inches(3/4)])
```

But the problem is ownership. 
You can mess things up easily since the variables aren't consumed.
```python
side_assembly = biscuit_join(table_leg1, table_leg2, joining_params)
table_leg1.rip(Inches(4))
```

There are some things you can do to make this a runtime error, such as marking a piece as no longer being mutable.
But in a quick inspection, the code isn't obviously wrong.
Similarly, it isn't always obvious that a variable could be referring to the same piece.
```python
table_leg2 = table_leg1
table_leg1.bevel(edges=['TL'], bit=Inches(3/4)])
table_leg2.bevel(edges=['TL'], bit=Inches(3/4)])
```

This behavior might be acceptable for some people.
But the advantage of the node system is that it is accessible for non programmers and visually makes sense.
