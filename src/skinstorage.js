// skinstorage.js – Custom Skin Datenhaltung

const LS_KEY = 'pacman-custom-skins';

// Skin-Struktur:
// {
//   id:     string   (eindeutig, z.B. 'custom_1720000000000')
//   name:   string   (Anzeigename, max 10 Zeichen)
//   type:   'tier' | 'mensch'
//   colors: {
//     body:   string  (Hauptfarbe Kopf/Körper)
//     ears:   string  (Ohren – tier: Außen, mensch: Haare)
//     inner:  string  (Ohren innen / Haar-Highlight)
//     eyes:   string  (Iris-Farbe)
//     extra:  string  (tier: Wangen/Schnauze, mensch: Hautton-Akzent)
//   }
// }

export function loadCustomSkins() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function _save(skins) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(skins)); }
  catch { /* Storage voll oder nicht verfügbar */ }
}

export function addCustomSkin(name, type, colors, shape = 'rund', whiskers = true) {
  const skins = loadCustomSkins();
  const skin = {
    id:       'custom_' + Date.now(),
    name:     name.toUpperCase().slice(0, 10),
    type,
    shape,
    whiskers,
    colors,
  };
  skins.push(skin);
  _save(skins);
  return skin;
}

export function updateCustomSkin(id, name, type, colors, shape = 'rund', whiskers = true) {
  const skins = loadCustomSkins();
  const idx = skins.findIndex(s => s.id === id);
  if (idx === -1) return null;
  skins[idx] = { ...skins[idx], name: name.toUpperCase().slice(0, 10), type, shape, whiskers, colors };
  _save(skins);
  return skins[idx];
}

export function deleteCustomSkin(id) {
  const skins = loadCustomSkins().filter(s => s.id !== id);
  _save(skins);
}
