---
tags:
  - typescript
  - vuex
  - web
  - passwords
  - development
title: "Simple Passwordless User Authorization"
date: 2022-02-18T20:56:33-06:00
draft: false
cover:
    image: "passwordless-auth.jpg"
---

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
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import http from "http";
import AuthController from './controllers/auth';

// configure the app and folder locations
const app = express();

// Reset the database every time we start the database
const db = GetDB();
db.connect();

// Serve static content
const server = http.createServer(app);
AuthController(app, db);
app.use(express.static(client_folder));

app.get("/api/*", (req,res)=>{
  res.status(404).send("NOT FOUND");
})
app.post("/api/*", (req,res)=>{
  res.status(404).send("NOT FOUND");
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(client_folder, 'index.html'));
});

server.listen(app.get("port"), () => {
  console.log(
    "App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("Press CTRL-C to stop\n");
});
```

It's trimmed down a but you can get the idea of where I'm going.
This is me hand trimming my code down, so don't expect to copy and paste this and get off to the races.

You might notice I have something called the auth controller. The auth controller is where the magic happens.

## Routes

To start, there are a few routes that I've setup.

- `api/login_temporary`
- `api/login_magic`
- `api/login`
- `api/logout`

Here's how they're setup:

```ts 
import { Express } from "express";

export default function RegisterEndPoints(app: Express, db: DataBase) {
    app.post(ApiEndpointRoot + ApiEndpoints.LOGIN_TEMP, async (req, res) => {
        // ...
    });

    // magic link login
    app.get(ApiEndpointRoot + ApiEndpoints.LOGIN_MAGIC, async (req, res) => {
        // ...
    });
    // Attempt to login a user
    app.post(ApiEndpointRoot + ApiEndpoints.LOGIN, async (req, res) => {
        // ...
    });

    // check if we're logged in
    app.use(async (req, res, next) => {
        // ...
    });

    app.get(ApiEndpointRoot + ApiEndpoints.LOGOUT, (req, res) => {
        // clear the login token
        res.clearCookie('token');
        res.redirect("/");
    });
}
```

I've taken out some of the code for brevity.
In this project, the client and server are in the same repo and are built together.
They have a folder called `common` that includes the state machine that powered the game, API endpoint definitions, and common types.
Makes it really handy to make sure that the server and the client won't get out of sync from a development standpoint, since typescript catches a lot of things.
Doesn't make it fool proof (browser caches can be tricky for weird bugs), but it solves a lot of problems as projects get larger.

There's a few helper functions, mostly around reading and writing the JWT token.

```ts
export function DecodeJwtToken(token: string): JwtUser | null {
    const results = (JwtDecode(token) as any);
    if (results == null) return null;
    const user: JwtUser = {
        name: results.name,
        _id: results._id,
        temporary: results.temporary,
    };
    return user;
}

function GiveToken(token_user: JwtUser, res: any, message: string, temporary?: boolean) {
    if (temporary == undefined || temporary == null) temporary = false;
    const expireInHours = temporary ? 24 : 10000; // about a year
    const token = JwtSign(token_user, JWT_SECRET, {
        expiresIn: expireInHours + 'h'
    });
    res.cookie('token', token, { maxAge: 1000 * 60 * 60 * expireInHours, secure:true });
    if (message != '') {
        res.json({
            token,
            message
        });
    }
}

function GenerateMagicCode() {
    const magic_key_length = 25;
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = Array(magic_key_length).fill('').map((x)=>characters.charAt(Math.floor(Math.random() * charactersLength))).join('');
    return result;
}
```

There are three functions: one to decode a token, one to give a token, and one to generate a magic code.
The token is just stored in a browser cookie named `token`.
In the future, it would be nice to have some sort of browser specific fingerprint encoded in the token. 
Or some other mechanism to prevent cookies from being stolen from the browser and used.
Perhaps in the future, some sort of refresh token mechanism could be employed.
Right now a session will last a very long time. In the future, there could be a refresh dance that isn't often transmitted (maybe in localstorage or something).

Back to the endpoints. First the temporary login.

```ts
export default function RegisterEndPoints(app: Express, db: DataBase) {
  // ...
  app.post(ApiEndpointRoot + ApiEndpoints.LOGIN_TEMP, async (req, res) => {
        try {
            const new_user_data: User = {
                email: '',
                name: RandomName(),
                temporary: true,
            }
            let new_user = await db.userAdd(new_user_data);
            if (new_user == null) {
                res.status(500).send("Unable to create temporary user");
                return;
            }
            const token_user: JwtUser = {
                _id: new_user._id,
                name: new_user.name,
                temporary: true,
            };
            GiveToken(token_user, res, "Created new temp account", true);
            return;
        }
        catch (e) {
            console.error("LoginUserTemp error:" + e);
            res.status(500).send("Not implemented");
        }
    });
  // ...
```

Basically, we generate a new user in the database, marking them as temporary.
Any account that is marked as temporary and is more than 36 hours old is cleaned out of the database.
We give them a token that only lasts 24 hours and there is no way to upgrade to a permanent account.

```ts
export default function RegisterEndPoints(app: Express, db: DataBase) {
  // ...
  // Attempt to login a user
    app.post(ApiEndpointRoot + ApiEndpoints.LOGIN, async (req, res) => {
        if (req.body['email'] == undefined) {
            res.status(300).send("Email missing");
            return;
        }
        const email = req.body['email'];
        if (req.body['email'] == '') {
            res.status(300).send("Email blank");
            return;
        }
        const valid_email = validateEmail(email);
        if (!valid_email) {
            res.status(300).send("Email is not valid");
            return;
        }

        let user = await AttemptLoginOrRegister(db, email);

        if (user == null) {
            res.status(300).send("Unable to create new account");
            return;
        }
        if (user == 'email') {
            // tell the user to check their email
            res.send("Check email");
            return;
        }

        const token_user: JwtUser = {
            _id: user._id,
            name: user.name,
            temporary: user.temporary || false,
        };
        GiveToken(token_user, res, "created user");
    });
```

Here we expect a post request that expects an email inside.
We validate the email (you'll need to provide this function) and then call `AttemptLogin`.
If the user already exists, we return back `email` which is a dumb design that tells us the account already exists. 
Otherwise, a new user is created.

```ts
// Attempt to login a given email, if they already exist then 
async function AttemptLoginOrRegister(db: DataBase, email: string): Promise<DbUser | null | 'email'> {
    try {
        if (email == '') return null;
        // Step 1: check if the user already exists, if so return email
        const user = await db.userFind(email, null);
        // The user exists, set their magic code and return
        if (user != null) {
            // TODO: generate a magic thing and set it into their user
            const magic_code = GenerateMagicCode();
            user.magicCode = magic_code;
            sendMagicCodeEmail(user, magic_code);
            console.log("http://localhost:3000"+ApiEndpointRoot+ApiEndpoints.LOGIN_MAGIC+"?code="+magic_code+"&id="+user._id);
            await db.userUpdate(user);
            return 'email';
        }
        const name_parts = email.split('@');
        const name = name_parts[0];
        // Step 2: the user doesn't exist so we need to create them
        const new_user_data: User = {
            email,
            name,
        }
        let new_user = await db.userAdd(new_user_data);
        if (new_user == null) return null;
        return new_user;
    }
    catch (e) {
        console.error("AttemptLoginOrRegister error:" + e);
        return null;
    }
}
```
In a nutshell, if they try to login in, we create a magic code in the database which gets sent to their email. 
Otherwise, if it's a unique email, create a new account and sign them in.
By default their username is the first part of the their email. However, usernames are not unique, emails are.

Here's the route for logging in with a magic code.

```ts
export default function RegisterEndPoints(app: Express, db: DataBase) {
    // ...
    // magic link login
    app.get(ApiEndpointRoot + ApiEndpoints.LOGIN_MAGIC, async (req, res) => {
        if (req.query['code'] == undefined) {
            res.status(300).send("Code missing");
            return;
        }
        if (req.query['id'] == undefined) {
            res.status(300).send("id missing");
            return;
        }
        const id = parseInt(req.query['id'].toString());
        const user = await db.userFind(null, id);
        if (user == null) {
            res.status(300).send("user not found");
            return;
        }
        const magic = req.query['code'];
        const curr_magic = user.magicCode;
        // erase the magic code
        if (user.magicCode != '') {
            user.magicCode = '';
            db.userUpdate(user);
        }
        // check if they don't have a magic code
        if (curr_magic == null || curr_magic == undefined || user.temporary || curr_magic == '' || magic !=curr_magic) {
            res.status(300).send("Magic code doesn't match");
            // TODO: erase magic code?
            return;
        }
        
        const token_user: JwtUser = {
            _id: user._id,
            name: user.name,
            temporary: user.temporary || false,
        };
        res.status(200)
        GiveToken(token_user, res, "");
        //res.send("<script>window.location.replace('/');</script>")
        res.redirect("/")
        return
    });
```

We send the user an email with a link to this endpoint via sendgrid (not sponsored, just easy to use).

The last and final part is handling decoding of the token.


```ts
export default function RegisterEndPoints(app: Express, db: DataBase) {
    // ...
    // check if we're logged in
    app.use(async (req, res, next) => {
        const path = req.path;
        if (path == '/favicon.ico' || path.startsWith('/js/') || path.startsWith('/img/') || path.startsWith('/css/') || path == '/login' || path.indexOf('.') != -1) {
            return next();
        }
        try {
            //console.error("Checking auth for "+ path);
            const token = (req.cookies) ? req.cookies['token'] : req.headers.authorization?.split("Bearer ")[1];
            if (!token) throw new Error("No Authorization Header");
            await JwtVerify(token, JWT_SECRET);
            res.locals.token = token;
            const results = (JwtDecode(token) as any);
            // TODO: check if the user actually exists?
            res.locals.user = results;
            return next();
        }
        catch (e) {
            //console.error("Auth check", e);
        }
        // TODO: redirect to login page if we're on a page that needs it
        if (path.startsWith('/api/') || path == '/logout') {
            return next();
        }
        // redirect to login
        console.error("Redirecting from " + req.path + " to /login");
        return res.redirect('/login');

    });
```

That's pretty much all there is to it.
User creates an account with just their email or can create a temporary account.
Their session lasts for a long time.
If it expires or they try to login from a different browser, they get a code to their email.
It's a great solution for a simple site that doesn't get much traffic.

If you see anything that can be improved, let me know!