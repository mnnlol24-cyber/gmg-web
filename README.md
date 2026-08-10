# GMG · Sitio web público

Landing de turismo médico de **Global Medical Group** (Barranquilla, Colombia).

- **Stack**: HTML + CSS + JS estático puro. Sin frameworks, sin build, sin dependencias.
- **Fuente**: Outfit (variable, auto-hospedada en `assets/fonts/`).
- **Iconos**: Phosphor Icons (SVG en `assets/icons/`, coloreados vía CSS mask).
- **Imágenes**: generadas con OpenArt (Nano Banana 2 / GPT Image 2), optimizadas a WebP.
- **Contacto**: WhatsApp y tel `+57 320 963 0957` · info@globalgroup-int.com.

## Ver en local

```bash
python -m http.server 4600 --directory gmg-web
# → http://localhost:4600
```

## Desplegar

Es un sitio 100% estático: cualquier hosting sirve (Vercel, Netlify, Cloudflare Pages).
En Vercel: importar el repo → framework "Other" → sin build command → output directory `.`
