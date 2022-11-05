---
title: "I Love Parsec + HomeKit"
date: 2022-11-05T15:16:05-05:00
cover:
    image: "parsec_hero.png"
tags:
  - opinion
  - development
  - homekit
---

I have lots of laptops and one desktop.
While jumping around the country, it's annoying to have to setup a dev environment on every machine.
There are solutions out there like docker, github codespaces, or renting a VM from one of the dozens of cloud providers.

But I already have a great desktop with everything I want already setup. I work on tons of different projects (most don't see enough work to warrant a writeup) and it's annoying to have to provision the different environment. Also show me an environment that can do Blender, KiCad, Web Dev, AI workloads (GPT-2 finetuning/Stable Diffusion), and writing all in a tidy package for a reasonable monthly price.

# The Setup

In a nutshell, I wake the server in my office remotely and then connect to it with a [low latency app called Parsec](https://parsec.app/).

It's geared towards gaming but it can be used for whatever (and supports tablet pen pressure for Blender, though I think you have to upgrade to Warp).

But to be accessible, the machine needs to be online.
The solution is to [use wake on magic packet](https://en.wikipedia.org/wiki/Wake-on-LAN).
It causes me a lot of pain in my work life so I figure I should use it for something in my personal life.
To send a magic packet, you basically just send a special packet to the address and the network hardware sees it and asserts an interrupt.
ACPI or the like passes it up to the hardware and suddenly you're up and running again.

However, my desktop sits behind my network and I'd like to think that randos out on the internet can't send arbitrary packets at my machine.
So I need to tell another machine on my network to send the packet for me.

In comes homebridge.
Specifically the [homebridge-wol](https://github.com/AlexGustafsson/homebridge-wol) plugin by Alex Gustafsson.

With a bit of configuration, I just open the home app and turn the desktop on, wait a few seconds and it shows up in parsec.

# It works?

So far it's been incredibly reliable. 

There has only been one time that it didn't work and it was because we briefly lost power while I was out of town so the machine was out. 
A quick change in the UEFI will make sure that on power loss, the machine will turn back on when it's connected to power.

I was in in LA over the weekend and in my AirBnb with a 12mbps connection (though it was relatively stable), I was able to connect and enjoy some programming and a bit of light gaming with a friend (Valhiem if you're really curious).

# Alternatives

I think I could set up an working setup with [tailscale](https://tailscale.com/) and VS Code's SSH remote working extension, but the advantage of Parsec is that it supports Blender and gaming. 
So the current setup is probably the best choice.
