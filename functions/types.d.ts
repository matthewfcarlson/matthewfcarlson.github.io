// These are the types used by every honeydew page function

export type MatthewCPageEnv = {
  PRODUCTION:"true"|"false"; // whether we are in production or not
  //HONEYDEW: KVNamespace;
  //HONEYDEWSQL: D1Database;
  TURNSTILE: string; // the turnstile secret
}

export type MatthewCPageData = {
//   db:Database;
  timestamp:number;
//   user: DbUser|null;
//   authorized:boolean;
//   jwt_raw: string;
//   jwt?:JwtPayload;
//   userid:UserId|null;
}

type MatthewCPageFunction<
  Params extends string = any
> = (context: EventContext<MatthewCPageEnv, Params, MatthewCPageData>) => Response | Promise<Response>;