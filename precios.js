// Lee products.json y le aplica precios.csv (el archivo que editas cada campaña).
const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell); if (row.some(x => x.trim() !== '')) rows.push(row);
  return rows;
}

function loadProducts(dir) {
  const products = JSON.parse(fs.readFileSync(path.join(dir, 'products.json'), 'utf8'));
  const file = path.join(dir, 'precios.csv');
  if (!fs.existsSync(file)) return products;
  const rows = parseCSV(fs.readFileSync(file, 'utf8'));
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = n => head.indexOf(n);
  const iId = col('id'), iPrecio = col('precio_venta'), iMostrar = col('mostrar');
  const map = {};
  rows.slice(1).forEach(r => { map[(r[iId] || '').trim()] = r; });
  return products
    .map(p => {
      const r = map[p.id];
      if (!r) return p;
      const n = parseFloat(String(r[iPrecio] || '').replace(/[$,\s]/g, ''));
      return Object.assign({}, p, { precio: n > 0 ? n : 0, _mostrar: !/^no$/i.test((r[iMostrar] || 'SI').trim()) });
    })
    .filter(p => p._mostrar !== false)
    .map(p => { const { _mostrar, ...rest } = p; return rest; });
}

module.exports = { loadProducts, parseCSV };
