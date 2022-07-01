import axios from "axios";
import * as cheerio from "cheerio";
import xpath from 'xpath'
import {DOMParser} from 'xmldom';
import * as fs from 'fs';

const urlBase = "https://pokemondb.net/";

const domParserOptions = {
  locator: {},
  errorHandler: { warning: function (w:any) { }, 
  error: function (e:any) { }, 
  fatalError: function (e:any) { console.error(e) } }
};

type PokemonIndex = {
  name: string,
  url: string,
};

type Pokemon = {
  name: string,
  species: string,
  image?: string,
  types: string[]
};


async function getPokemonList() : Promise<Array<PokemonIndex>> {
  const pokemons : Array<PokemonIndex> = [];
  const response = await axios.get(`${urlBase}pokedex/all`);
  const $ = cheerio.load(response.data);
  const responsePokemons = $("#pokedex .ent-name");
  
  responsePokemons.each((_, pokemon) => {
    const name = $(pokemon).text();
    const url = $(pokemon).attr("href");
    pokemons.push({ name, url: `${urlBase}${url}` });
  });

  return pokemons;
}

async function getPokemon({name, url}: PokemonIndex) {
  try{ 
    const response = await axios.get(url);
    const dom = new DOMParser(domParserOptions).parseFromString(response.data);
    const species = xpath.select("string(/html/body/main/div[3]/div[2]/div/div[1]/div[2]/table/tbody/tr[3]/td)",dom).toString();
    const types = [...new Set(xpath.select("/html/body/main/div[3]/div[2]/div/div[1]/div[2]/table/tbody/tr[2]/td/a",dom).map((type : any )=> type.lastChild.data))];
    const image = `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`;
    return { name, species, image, types };
  }catch(e:any){
    console.error("Axios error", e.message);
  }
}

async function getPokemons(){
  const data : Pokemon[] = [];
  const pokemons = await getPokemonList();
  for(const pokemon of pokemons){
    const pokemonData = await getPokemon(pokemon);
    pokemonData ? data.push(pokemonData): null;
  }
  return data;
}

async function getTypes() {
  const url = 'https://pokemondb.net/type';
  const xpathString = '/html/body/main/div[1]/div[1]/p/a';
  const response = await axios.get(url);
  const dom = new DOMParser(domParserOptions).parseFromString(response.data);
  const types = [...new Set(xpath.select(xpathString,dom).map((type : any )=> type.lastChild.data))];
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


async function main(){
  saveTypes();
}

main();