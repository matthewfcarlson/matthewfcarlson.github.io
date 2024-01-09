import { MatthewCPageFunction } from "../types";


export const onRequestGet: MatthewCPageFunction = async function (context) {

    return new Response("working = true;", { headers: { "Content-Type": "application/javascript" } },)
}