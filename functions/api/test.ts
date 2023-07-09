import { MatthewCPageFunction } from "../types";
// import Database from "../database/_db";
// import { deleteCookie, ResponseJsonAccessDenied, ResponseJsonMissingData, ResponseJsonNotFound, ResponseJsonNotImplementedYet, ResponseJsonServerError } from "../_utils";
// import { AuthCheck, AuthCheckZ, TEMP_TOKEN } from "./auth_types";


export const onRequestGet: MatthewCPageFunction = async function (context) {

    return new Response("working = true;", { headers: { "Content-Type": "application/javascript" } },)
}