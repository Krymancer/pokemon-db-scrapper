"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const xpath_1 = __importDefault(require("xpath"));
const xmldom_1 = require("xmldom");
const fs = __importStar(require("fs"));
const urlBase = "https://pokemondb.net/";
const domParserOptions = {
    locator: {},
    errorHandler: { warning: function (w) { },
        error: function (e) { },
        fatalError: function (e) { console.error(e); } }
};
async function getPokemonList() {
    const pokemons = [];
    const response = await axios_1.default.get(`${urlBase}pokedex/all`);
    const $ = cheerio.load(response.data);
    const responsePokemons = $("#pokedex .ent-name");
    responsePokemons.each((_, pokemon) => {
        const name = $(pokemon).text();
        const url = $(pokemon).attr("href");
        pokemons.push({ name, url: `${urlBase}${url}` });
    });
    return pokemons;
}
async function getPokemon({ name, url }) {
    try {
        const response = await axios_1.default.get(url);
        const dom = new xmldom_1.DOMParser(domParserOptions).parseFromString(response.data);
        const species = xpath_1.default.select("string(/html/body/main/div[3]/div[2]/div/div[1]/div[2]/table/tbody/tr[3]/td)", dom).toString();
        const types = [...new Set(xpath_1.default.select("/html/body/main/div[3]/div[2]/div/div[1]/div[2]/table/tbody/tr[2]/td/a", dom).map((type) => type.lastChild.data))];
        const image = `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`;
        return { name, species, image, types };
    }
    catch (e) {
        console.error("Axios error", e.message);
    }
}
async function getPokemons() {
    const data = [];
    const pokemons = await getPokemonList();
    for (const pokemon of pokemons) {
        const pokemonData = await getPokemon(pokemon);
        pokemonData ? data.push(pokemonData) : null;
    }
    return data;
}
async function getTypes() {
    const url = 'https://pokemondb.net/type';
    const xpathString = '/html/body/main/div[1]/div[1]/p/a';
    const response = await axios_1.default.get(url);
    const dom = new xmldom_1.DOMParser(domParserOptions).parseFromString(response.data);
    const types = [...new Set(xpath_1.default.select(xpathString, dom).map((type) => type.lastChild.data))];
    return types;
}
async function savePokemons() {
    const pokemons = await getPokemons();
    const jsonData = JSON.stringify(pokemons);
    fs.writeFileSync("data/pokemons.json", jsonData);
}
async function saveTypes() {
    const types = await getTypes();
    const jsonData = JSON.stringify(types);
    fs.writeFileSync("data/types.json", jsonData);
}
async function main() {
    saveTypes();
}
main();
