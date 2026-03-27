#!/usr/bin/env node
/**
 * Downloads SSA baby name data and processes it into a compact JSON file
 * for the bump chart visualization.
 *
 * Usage: node scripts/process-baby-names.mjs
 * Output: content/musings/baby-names/names.json
 */

import { createWriteStream, mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { createUnzip } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "content", "musings", "baby-names");
const ZIP_PATH = join(ROOT, "scripts", "names.zip");
const OUT_PATH = join(OUT_DIR, "names.json");

const SSA_URL = "https://www.ssa.gov/oact/babynames/names.zip";
const TOP_N = 1000;

// Variant → canonical name mappings (merge counts before ranking).
// Includes clear diminutives and spelling variants.
const MERGE_M = {
  // Diminutives
  Bill: "William", Billy: "William", Billie: "William", Willie: "William", Willy: "William", Will: "William",
  Bob: "Robert", Bobby: "Robert", Bobbie: "Robert",
  Jim: "James", Jimmy: "James", Jimmie: "James",
  Johnny: "John", Johnnie: "John", Johnie: "John",
  Tommy: "Thomas", Tommie: "Thomas", Tom: "Thomas",
  Joe: "Joseph", Joey: "Joseph",
  Eddie: "Edward", Ed: "Edward", Edd: "Edward",
  Charlie: "Charles", Charley: "Charles",
  Danny: "Daniel", Dan: "Daniel",
  Ben: "Benjamin", Benny: "Benjamin", Bennie: "Benjamin",
  Tim: "Timothy", Timmy: "Timothy",
  Tony: "Anthony",
  Dave: "David",
  Ron: "Ronald", Ronnie: "Ronald",
  Don: "Donald", Donnie: "Donald",
  Ken: "Kenneth", Kenny: "Kenneth",
  Sam: "Samuel", Sammy: "Samuel",
  Fred: "Frederick", Freddie: "Frederick",
  Larry: "Lawrence",
  Mike: "Michael",
  Rick: "Richard", Ricky: "Richard", Rickey: "Richard", Dick: "Richard",
  Steve: "Steven",
  Ted: "Theodore", Teddy: "Theodore", Theo: "Theodore",
  Pete: "Peter",
  Andy: "Andrew",
  Jeff: "Jeffrey",
  Doug: "Douglas",
  Greg: "Gregory",
  Gene: "Eugene",
  Brad: "Bradley",
  Marty: "Martin",
  Ray: "Raymond",
  Jackie: "Jack",
  Nick: "Nicholas",
  Chris: "Christopher",
  Clint: "Clinton",
  Xander: "Alexander",
  // Spelling variants
  Mathew: "Matthew", Micheal: "Michael", Nicolas: "Nicholas",
  Kristopher: "Christopher", Jakob: "Jacob", Kaleb: "Caleb",
  Zachery: "Zachary", Jonathon: "Jonathan", Johnathan: "Jonathan",
  Conner: "Connor", Elliot: "Elliott", Erick: "Eric", Erik: "Eric",
  Cristian: "Christian", Dominick: "Dominic", Shaun: "Sean", Shawn: "Sean",
  Randal: "Randall", Jeffery: "Jeffrey", Allan: "Alan", Allen: "Alan",
  Gregg: "Gregory", Garry: "Gary", Phillip: "Philip", Neal: "Neil",
  Marc: "Mark", Collin: "Colin", Fredrick: "Frederick", Jaxson: "Jaxon",
};

const MERGE_F = {
  // Diminutives
  Betty: "Elizabeth", Bettie: "Elizabeth", Bette: "Elizabeth", Beth: "Elizabeth",
  Bess: "Elizabeth", Bessie: "Elizabeth", Lizzie: "Elizabeth", Lizbeth: "Elizabeth",
  Katie: "Katherine", Kate: "Katherine", Kathy: "Katherine",
  Jennie: "Jennifer", Jenny: "Jennifer",
  Maggie: "Margaret", Margie: "Margaret", Peggy: "Margaret",
  Patty: "Patricia", Patti: "Patricia", Pat: "Patricia", Patsy: "Patricia",
  Becky: "Rebecca",
  Debbie: "Deborah", Debra: "Deborah", Debora: "Deborah",
  Sandy: "Sandra", Sondra: "Sandra",
  Cindy: "Cynthia",
  Jackie: "Jacqueline", Jaclyn: "Jacqueline", Jacquelyn: "Jacqueline",
  Sue: "Susan", Susie: "Susan", Suzanne: "Susan",
  Vicki: "Victoria", Vickie: "Victoria", Vicky: "Victoria",
  Nikki: "Nicole", Nichole: "Nicole",
  Connie: "Constance",
  Rosie: "Rose",
  Bobbie: "Roberta",
  Cassie: "Cassandra",
  Josie: "Josephine",
  Fannie: "Frances", Fanny: "Frances",
  Tillie: "Matilda",
  Pam: "Pamela",
  Kim: "Kimberly", Kimberley: "Kimberly",
  Stefanie: "Stephanie",
  Tammie: "Tamara", Tammy: "Tamara", Tami: "Tamara",
  Tracey: "Tracy", Traci: "Tracy", Tracie: "Tracy",
  Stacey: "Stacy", Stacie: "Stacy",
  Kelley: "Kelly", Kelli: "Kelly", Kellie: "Kelly",
  Teri: "Teresa", Terri: "Teresa", Terry: "Teresa", Theresa: "Teresa",
  Christa: "Christina", Christie: "Christina", Christy: "Christina", Cristina: "Christina",
  Gracie: "Grace",
  Sophie: "Sophia",
  Dollie: "Dolores", Delores: "Dolores", Deloris: "Dolores",
  Lucile: "Lucille",
  // Spelling variants
  Sara: "Sarah", Rachael: "Rachel", Rebekah: "Rebecca",
  Isabelle: "Isabella", Izabella: "Isabella",
  Sofia: "Sophia", Hanna: "Hannah", Norah: "Nora",
  Zoey: "Zoe", Ashlee: "Ashley", Ashleigh: "Ashley",
  Brittney: "Brittany", Chelsey: "Chelsea", Lindsay: "Lindsey",
  Catherine: "Katherine", Kathryn: "Katherine", Katharine: "Katherine",
  Allison: "Alison", Allyson: "Alison",
  Hailey: "Haley", Hayley: "Haley",
  Caitlin: "Kaitlyn", Caitlyn: "Kaitlyn", Kaitlin: "Kaitlyn",
  Meagan: "Megan", Meghan: "Megan",
  Jazmin: "Jasmine", Jazmine: "Jasmine", Jasmin: "Jasmine",
  Briana: "Brianna", Julianna: "Juliana", Arianna: "Ariana",
  Dianna: "Diana", Dianne: "Diana", Diane: "Diana",
  Makenzie: "Mackenzie", Mckenzie: "Mackenzie",
  Madelyn: "Madeline",
  Makayla: "Michaela", Mikayla: "Michaela",
  Rylee: "Riley", Ryleigh: "Riley",
  Lillie: "Lily", Lilly: "Lily",
  Aubree: "Aubrey",
  Kylee: "Kylie",
};

async function downloadZip() {
  if (existsSync(ZIP_PATH)) {
    console.log("Using cached names.zip");
    return;
  }
  console.log(`Downloading ${SSA_URL} ...`);
  const res = await fetch(SSA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const fileStream = createWriteStream(ZIP_PATH);
  await pipeline(Readable.fromWeb(res.body), fileStream);
  console.log("Download complete.");
}

async function extractAndProcess() {
  // Use the unzip command to extract yob files
  const { execSync } = await import("child_process");

  const tmpDir = join(ROOT, "scripts", "_tmp_names");
  mkdirSync(tmpDir, { recursive: true });

  console.log("Extracting zip...");
  execSync(`unzip -o -q "${ZIP_PATH}" -d "${tmpDir}"`);

  // Find all yobYYYY.txt files
  const { readdirSync } = await import("fs");
  const files = readdirSync(tmpDir)
    .filter((f) => /^yob\d{4}\.txt$/.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error("No yobYYYY.txt files found in zip");
  }

  const startYear = parseInt(files[0].match(/\d{4}/)[0]);
  const endYear = parseInt(files[files.length - 1].match(/\d{4}/)[0]);
  const numYears = endYear - startYear + 1;

  console.log(`Processing ${files.length} years: ${startYear}-${endYear}`);

  // Pass 1: identify names that ever appeared in top N
  // Pass 2: store their FULL rank each year (even beyond top N)
  // Rank 0 = name didn't exist that year at all

  // First pass: collect all yearly sorted lists + find top-N names
  const topNKeys = new Set();
  const yearlySorted = []; // [{M: [[name, count], ...], F: [...]}, ...]

  for (const file of files) {
    const year = parseInt(file.match(/\d{4}/)[0]);
    const yearIndex = year - startYear;
    const content = readFileSync(join(tmpDir, file), "utf-8");
    const lines = content.trim().split("\n");

    const bySex = { M: new Map(), F: new Map() };
    const mergeMap = { M: MERGE_M, F: MERGE_F };
    for (const line of lines) {
      const parts = line.trim().split(",");
      if (parts.length < 3) continue;
      let [name, sex, countStr] = parts;
      const count = parseInt(countStr);
      if (sex !== "M" && sex !== "F") continue;
      const canonical = mergeMap[sex][name] || name;
      const prev = bySex[sex].get(canonical) || 0;
      bySex[sex].set(canonical, prev + count);
    }

    const sorted = { M: null, F: null };
    for (const sex of ["M", "F"]) {
      sorted[sex] = [...bySex[sex].entries()].sort((a, b) => b[1] - a[1]);
      // Mark top N
      for (let i = 0; i < Math.min(sorted[sex].length, TOP_N); i++) {
        topNKeys.add(`${sorted[sex][i][0]}|${sex}`);
      }
    }
    yearlySorted[yearIndex] = sorted;
  }

  console.log(`Found ${topNKeys.size} names that appeared in top ${TOP_N}`);

  // Second pass: for each top-N name, store actual rank every year
  const nameRanks = new Map();
  for (const key of topNKeys) {
    nameRanks.set(key, new Array(numYears).fill(0));
  }

  for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
    const sorted = yearlySorted[yearIndex];
    for (const sex of ["M", "F"]) {
      for (let rank = 0; rank < sorted[sex].length; rank++) {
        const name = sorted[sex][rank][0];
        const key = `${name}|${sex}`;
        if (nameRanks.has(key)) {
          nameRanks.get(key)[yearIndex] = rank + 1;
        }
      }
    }
  }

  // Build output
  const names = [];
  for (const [key, ranks] of nameRanks) {
    const [name, sex] = key.split("|");
    names.push([name, sex, ranks]);
  }

  // Sort by sex then name for consistent output
  names.sort((a, b) => {
    if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
    return a[0] < b[0] ? -1 : 1;
  });

  const output = {
    startYear,
    endYear,
    names,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output));

  const sizeKB = (readFileSync(OUT_PATH).length / 1024).toFixed(0);
  console.log(`Wrote ${OUT_PATH} (${sizeKB} KB, ${names.length} names)`);

  // Clean up
  execSync(`rm -rf "${tmpDir}"`);
  console.log("Done.");
}

try {
  await downloadZip();
  await extractAndProcess();
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
