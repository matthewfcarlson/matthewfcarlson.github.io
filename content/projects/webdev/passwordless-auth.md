# Passwordless User Authorization

I hate passwords. Not as a user as password management is basically solved with most modern browsers and password managers.
What I hate is having to deal with them as a developer. Hashing, storing, authentication, etc.

I did a small project recently using my socket.io synced vuex state and needed a system where users could easily login. 
I will put a *huge* disclaimer on this that this is just what I did for my personal project where security isn't critical.
If a login gets stolen, it's to a silly game that my friends and I play.
The techniques described shouldn't be used in production without some refinement.
If you have ideas on how to implement this in a more secure way, definitely reach out to me!

## Server Setup

I'm using express as a server, so I'll put that out there as a baseline.
I'm also using TypeScript, because why would you not use it?
Setting up my server I have a controller type file that I can pass in. 
So here's my server file:

```ts
// SERVER CODE

```

and then the auth controller is where the magic happens.

## Routes

To start, there are a few routes that I've setup.
