---
title: "Magic Mechanical Keyboard"
date: 2022-03-06T08:07:23-06:00
draft: true
cover:
    image: "cover.jpg"
tags:
  - PCB
  - KiCAD
  - keyboard
  - office
#  - woodworking
---

Like many programmers/engineers/gamers, I've found that I just enjoy mechanical keyboards.

Maybe it's just the noise.

Maybe I just like the ways the keys feel.

Maybe it's all in my head.

Either way, I prefer a mechanical keyboard and I am willing to spend some number of dollars on it.
Does it make me a better typist?
I don't think so.
Does it allow me to type faster?
Don't think so. The WPM tests I've done are too varied even on the same keyboard.

I have a 16" Intel Macbook Pro as my portable dev machine from work and I use it closed in a dock.
This means that the fantastic Touch ID sensor on the Macbook's keyboard is unavailable for authenticating.
My Apple Watch takes care of a lot of things but not everything.
Particularly sudo authentication.

Apple makes a version of it's keyboard known as the [Magic Keyboard with Touch ID](https://www.apple.com/shop/product/MK293LL/A/magic-keyboard-with-touch-id-for-mac-models-with-apple-silicon-us-english).
It has a Touch ID sensor in it and everything.
There's only one problem was that it's a flat chiclet style keyboard, which after using for a bit I just don't care for.
It's for some people, but not for me.

Before we get too much farther into this, I'll put this big old disclosure in there.

**I do work for Apple but I do not have access to schematics for keyboards nor work on peripherals**

**This represents my own work and opinion and is no way something that is endorsed/supported/affiliated with Apple**

Hopefully that's enough of legalese to cover my butt 🤞 :heart:

So here's the product of my labors:

![finished product](finished_product.png)

It's gorgeous.

# Cracking Open The Keyboard

First step was to crack open the keyboard.
IFixIt has a [wonderful teardown guide](https://www.ifixit.com/Teardown/Magic+Keyboard+Teardown/50995) for previous magic keyboards.
I wasn't able to find a video of a more recent teardown, so I was going in pretty dark.

# Designing the PCB

Now that I had the logic board extracted and a plan, it was time to get to work designing a PCB.
I've traditionally used Eagle and Altium (when someone was willing to pay for it) but I decided to give [KiCad](https://www.kicad.org) a try. 
The 3d viewer in particular (now that I'm much better at blender)

# Ideas

Kailh Sockets
https://github.com/50an6xy06r6n/hotswap_pcb_generator
https://kbdfans.com/products/mechanical-keyboard-switches-kailh-pcb-socket
https://github.com/sszczep/Cherry-MX-Breakout-Board
https://github.com/daprice/keyswitches.pretty
https://github.com/colemarkham/keyboard_parts.pretty
https://github.com/ai03-2725/Type-C.pretty
https://github.com/ai03-2725/WS2812B.pretty

