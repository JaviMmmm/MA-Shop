require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const { loadProducts } = require('./precios');
const products = () => loadProducts(__dirname);

// Datos públicos para la página (el WhatsApp y el catálogo)
app.get('/api/config', (req, res) => {
  res.json({
    whatsapp: process.env.WHATSAPP,
    products: products(),
    catalogos: JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogos.json'), 'utf8'))
  });
});

// Crea el cobro en Mercado Pago. Los precios salen del servidor, nunca del navegador.
app.post('/api/checkout', async (req, res) => {
  try {
    const catalog = products();
    const items = [];
    for (const it of req.body.items || []) {
      const p = catalog.find(x => x.id === it.id);
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 0), 20);
      if (p && p.precio > 0 && qty > 0) {
        items.push({ id: p.id, title: p.nombre, quantity: qty, unit_price: p.precio, currency_id: 'MXN' });
      }
    }
    if (!items.length) return res.status(400).json({ error: 'Carrito vacío' });

    const orderId = 'P' + Date.now();
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify({
        items,
        external_reference: orderId,
        back_urls: {
          success: BASE_URL + '/?pago=ok',
          pending: BASE_URL + '/?pago=pendiente',
          failure: BASE_URL + '/?pago=error'
        },
        auto_return: 'approved',
        notification_url: BASE_URL + '/webhook'
      })
    });
    const data = await r.json();
    if (!r.ok) { console.error(data); return res.status(502).json({ error: 'Mercado Pago rechazó el cobro' }); }
    res.json({ url: data.init_point });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Mercado Pago avisa aquí cuando hay un pago. Lo verificamos consultando a Mercado Pago.
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const id = (req.body && req.body.data && req.body.data.id) || req.query['data.id'];
    if (!id || (req.body.type && req.body.type !== 'payment')) return;
    const r = await fetch('https://api.mercadopago.com/v1/payments/' + id, {
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    const pay = await r.json();
    if (pay.status === 'approved') {
      const order = {
        pedido: pay.external_reference,
        pago_id: pay.id,
        total: pay.transaction_amount,
        email: pay.payer && pay.payer.email,
        fecha: pay.date_approved,
        productos: (pay.additional_info && pay.additional_info.items) || []
      };
      console.log('PAGO APROBADO:', JSON.stringify(order));
      fs.appendFileSync(path.join(__dirname, 'pedidos.log'), JSON.stringify(order) + '\n');
    }
  } catch (e) { console.error('Webhook:', e); }
});

app.listen(process.env.PORT || 3000, () => console.log('Tienda lista en ' + BASE_URL));
