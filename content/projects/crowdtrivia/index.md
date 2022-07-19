---
title: "Making a Livestreamed Gaming Platform In A Weekend"
date: 2022-07-17T22:38:01-05:00
draft: true
inprogress: true
cover:
    image: "cover.jpg"
tags:
  - azure
  - python
  - webdev
#  - webdev
---


I've mentioned [Padgames](/projects/vuex-sync-p1) here on the blog before, but I've tried to create games that everyone can gather around a central screen and play.
Jackbox are a staple in my house for that reason.
I also was in college when Twitch Plays Pokemon reached its zennith.
Over the past few months a friend of mine and I had been talking about creating automated Youtube channels.
All these ideas sort of landed in my head and while isolating at home with a fever, these ideas seemed to merge in my head.
And so crowdtrivia was born.

In a nutshell, it is just a trivia game that is rendered and livestreamed to twitch and Youtube Live.
The code is all written to be fairly modular to allow different games.
There's already a second game mode coming out soon called CrowdPoll.
The basic nutshell is that you try to guess what the preferences of the people you're playing with are on common, mundane topics.
Are you in line with the majority or are you good at guessing what people prefer?

It offers more replayability than trivia questions, what are of dubious quality, hard to source, and even harder to score.

So with that all out of the way, let's get into how I made it.

## Step 1: Getting a stream up

I had never streamed on anything before and digging into the documentation showed that RTMP seemed to be fairly prevalant.
There are plenty of simple servers on Github (and even a handy [full python one](https://github.com/KnugiHK/rtmplite3)).
But I didn't send a server, I needed a client to transmit to a server.
This was a long, dark rabbit hole with lots of spikes in the sides as you went down.
I don't love the solution I landed on, but I had a weekend to get it done in.

As far as I could tell from an hour or two of scanning through Github and Stackoverflow, most video livestreamed isn't rendered on a headless computer.
It is usually coming from a screencapture, camera, or a prerecordered source.

FFMPEG offers some great options to stream from a file or camera straight to the RTMP endpoint.
Something like [v4l2loopback](https://github.com/umlaeute/v4l2loopback) fits the bill, which is a virtual camera.

My test command ended up like this.

```
ffmpeg \
-f v4l2 -r 10 -i /dev/video0 \
-f lavfi -i anullsrc \
-c:v libx264 -pix_fmt yuvj420p -preset ultrafast -g 20 -b:v 2500k -x264-params keyint=48:min-keyint=48:scenecut=-1 \
-c:a aac -ar 44100 \
-vcodec libx264 -preset superfast -bufsize 960k -crf 28 -threads 2 \
-f flv rtmp://a.rtmp.youtube.com/live2/KEY_REDACTED
```

I just needed to write to the virtual camera.
This a future area of improvement but in the meantime, I found [pyvirtualcam](https://github.com/letmaik/pyvirtualcam), which allows you to write straight to the virtual camera from python using numpy.
In the future, I'd like to further explore rewriting this code in something faster if needed.
It would be nice to do away with python and write to the virtual camera itself (in linux this is just a file and it's relatively easy).
There was a quick attempt at this but getting something that could write to the OBS virtual camera in windows (where I was prototyping) and Linux with a minimal toolchain sucked.
C/C++ is actually pretty decent in my eyes but setting it up is awful (you have specify exactly what files you want, which means an IDE is almost a must instead of optional. I dislike makefiles as they are often huge jumbled piles of garbage, lots of strong opinions here).
I could remove the virtual camera, write the image data directly to a stream and pump that into FFMPEG, but I found significantly less documentation on that.

While ugly, the prototype perf looked good as writing every pixel every frame still spends 80% of each frame time in idle.
The VM is on Azure (still have free credits) and it's just a small 2 core, 4GB machine and it still has plenty of overhead (running at around 30% on both cores and 700MB of used memory even when sending to two stream sources).

Getting v4l2loopback setup and figuring out why Youtube wasn't liking my stream (needs an audio compoenent) or what the difference between yuv420p and yuvj420p all took time but I was happy to see it working.

## Step 2: Getting the stream to two places

The next step was to take the stream to two places and here I cheated again.
I found [restreamer](https://github.com/datarhei/restreamer) which is a pretty handy piece of software.
It comes in a nice docker container and with an Apache 2 license.
Luckily, I had messed with docker on an earlier project and it ended up being pretty easy to configure.
With that up, I just pointed it at my virtual webcam (make sure to write frames to it) and I quickly had two streams up and going.

## Step 3: Asking Questions

There are now two pieces of this: the renderer and the brain.
The renderer pushes pixels to the virtual webcam and the brain keeps track of the questions.
I thought about using solid.js and tinkered with it a bit but decided to go down the route I know: Vue.JS.
I borrowed the [vitesome](https://github.com/alvarosabu/vitesome) starter template and after creating a bit of an adapter so the websocket, api, and other stuff would still work whether I was using the express backend or the vite dev server, I had something decent.


## Step 4: Integrating with Streams

The whole point of going through the complex part of rendering the video stream in real time is that we can react to when a user joins or does something awesome.
This means keeping track of the streams we're on and letting the renderer know.

## Step 5: Getting Answers

Perhaps we can just poll the twitch chat.
But when spammed by thousands of people

I love Vue.JS and generally dislike React (if you have a problem with this article, you're welcome to suggest a change, link at the top).
The theme of this project is trying new things and I had watched an interesting video about [Solid.js](https://www.youtube.com/watch?v=hw3Bx5vxKl0&ab_channel=Fireship).

In terms of reliability, I'll throw it onto an Azure webserver.
Plus, that's one less than that's based on something new.
I wanted to use the [bun runtime](https://bun.sh/), but after playing around with it a bit, it needs a bit more time in the oven.
Very much looking forward to it.

Solid even has [a handy template](https://github.com/solidjs/templates/tree/master/ts-vitest) for integrating vite with TypeScript.

## Step 6: Scoring Answers & Keeping Track Of Users

We're going to need a database and keep track of viewers.

## Step 7: Trivia Sessions

## Step 8: Going Further

You could take this a lot farther.
I'm curious to experiement with large scale crowd games. 
What happens to a game of life when there are 1000s of players instead of 6?

Frankly, I don't know.

But I'm looking forward to finding out.


### Addendum

Is this code open source?
I'm not sure.

It's dirty weekend prototype code.
On the other hand, there wasn't much information about what I was trying to do.
If there's at least 5 people asking for it, I'll clean it up and publish the rendering engine and server for crowdtrivia.


