---
title: "Jukebox"
date: 2022-07-04T11:08:04-05:00
draft: true
inprogress: true
cover:
    image: "cover.jpg"
tags:
#  - woodworking
#  - webdev
---

It's a modern jukebox with somewhat physical media.
You grab an album, stick it in the slot, and you can hear it playing throughout the house via airplay.

( IMAGE HERE )

## Step 1: Creating the Media

I had a little HP Sprocket printer that prints 2x3 images that are sticky on the back.
It seemed perfect for prototyping.
There was a [hackaday article](https://hackaday.com/2021/12/07/cracking-the-spotify-code/) about [cracking spotify codes](https://boonepeter.github.io/posts/spotify-codes-part-2/) that really got me thinking.
I could leverage the same system to encode a URI.

I first used [spotify's own tools](https://spotifycodes.com/#) for making a code and a bit of paint to make a print about the right size.
Then it was time to work on the reader and player.

## Step 2: Reading the Codes

I dug through my closet and happened on a Pi Zero W (thanks 2018 me for hoarding a bunch of Pis) as well as a V1.1 Pi Camera.
The resolution isn't amazing but it doesn't need to be.

