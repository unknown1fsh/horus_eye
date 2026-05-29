// Strips Natural Earth admin0 GeoJSON to only the properties we use. Natural
// Earth's published admin0 datasets are already antimeridian-clean (Russia,
// Antarctica, USA-Alaska are pre-split at +/-180 in the MultiPolygon), so this
// script does NOT attempt its own split — that was a bug source.
//
// Usage: node scripts/strip-geojson.mjs

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DIR = join(__dirname, '..', 'public', 'geo');

const FILES = ['countries-110m.geojson', 'countries-50m.geojson', 'countries-10m.geojson'];

const pickIso = (p) => {
  const eh = p.ISO_A2_EH;
  if (eh && eh !== '-99') return eh;
  const a2 = p.ISO_A2;
  if (a2 && a2 !== '-99') return a2;
  return null;
};

for (const filename of FILES) {
  const path = join(GEO_DIR, filename);
  const sizeBefore = statSync(path).size;
  const raw = readFileSync(path, 'utf8');
  const json = JSON.parse(raw);

  const features = [];
  for (const f of json.features) {
    const p = f.properties || {};
    const iso = pickIso(p);
    if (!f.geometry) continue;

    features.push({
      type: 'Feature',
      properties: {
        iso,
        iso3: p.ISO_A3_EH && p.ISO_A3_EH !== '-99' ? p.ISO_A3_EH : p.ISO_A3,
        name: p.NAME,
        nameTr: p.NAME_TR,
        admin: p.ADMIN,
        continent: p.CONTINENT,
        subregion: p.SUBREGION,
        popEst: p.POP_EST,
        wikidata: p.WIKIDATAID,
        labelX: p.LABEL_X,
        labelY: p.LABEL_Y
      },
      geometry: f.geometry
    });
  }

  const stripped = { type: 'FeatureCollection', features };
  writeFileSync(path, JSON.stringify(stripped));
  const sizeAfter = statSync(path).size;
  console.log(`${filename}: ${features.length} features, ${(sizeBefore / 1024).toFixed(0)}KB -> ${(sizeAfter / 1024).toFixed(0)}KB`);
}
