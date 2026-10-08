# Mi tienda en línea (con pago automático de Mercado Pago)

## 1. Probar en tu computadora
1. Instala Node.js 18 o más nuevo (nodejs.org).
2. En la carpeta del proyecto: `npm install`
3. Copia `.env.example` como `.env` y pega tu **Access Token de PRUEBA** de Mercado Pago
   (mercadopago.com.mx/developers → Tus integraciones → Crear aplicación → Credenciales de prueba).
4. `npm start` y abre http://localhost:3000

## 2. Poner tus productos
Edita `products.json` (id, nombre, categoría, precio, icono). Los precios SOLO se leen del servidor.

## 3. Publicarla en internet (ejemplo: Render.com, plan gratis para empezar)
1. Sube esta carpeta a un repositorio de GitHub (SIN el archivo `.env`).
2. En Render: New → Web Service → conecta el repositorio. Build: `npm install`. Start: `npm start`.
3. En "Environment" agrega: `MP_ACCESS_TOKEN`, `WHATSAPP` y `BASE_URL` (la dirección https que te da Render).
4. Cuando todo funcione con pagos de prueba, cambia a tu Access Token de PRODUCCIÓN.

## 4. Pedidos
Cada pago aprobado se imprime en los logs del servidor y se guarda en `pedidos.log`.
Ojo: en planes gratis el disco se borra al reiniciar; revisa los logs o agrega una base de datos más adelante.
Mercado Pago también te manda su correo y aparece en tu cuenta.

## Seguridad
- Nunca pongas tu Access Token en `index.html` ni lo subas a GitHub.
- Para producción, conviene validar la firma del webhook (ver documentación "Notificaciones Webhooks").

## Catálogos completos (PDF)
Los PDF pesan 50-70 MB cada uno: no los subas al servidor. Súbelos a Google Drive (compartir: "Cualquiera con el enlace"),
copia el enlace y pégalo en `catalogos.json` (campo `url`). Cada campaña cambia el enlace y el texto "C14". Sin enlace, el botón pide el catálogo por WhatsApp.

## Precios
Los productos con `"precio": 0` muestran "Consultar precio" por WhatsApp. Cuando pongas el precio de la campaña, aparece el carrito y el pago con Mercado Pago.

## Actualizar precios cada campaña (precios.csv)
Abre `precios.csv` en Excel o Google Sheets y llena solo dos columnas:
- `precio_venta`: el precio al que vendes. Si lo dejas vacío, la tarjeta muestra "Consultar precio".
- `mostrar`: pon `NO` en los productos que ya no vienen en la campaña.
Guarda como CSV (UTF-8), reemplaza el archivo y reinicia el servidor (en Render: Manual Deploy). No hace falta tocar código.
Las columnas de "ref_c14" son solo de referencia (precios del catálogo del ciclo 14).
