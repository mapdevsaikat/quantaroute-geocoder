# QuantaRoute Geocoder REST

Vercel output directory. APIs live under `/api`. **v1.1.0**

- Geocode: optional `latitude` + `longitude` for local bias and category nearby (`hospital near me`).
- Autocomplete: optional `lat` + `lng` (same).
- Missing API key → **401**. Postal `find-nearby-boundaries` is still not implemented.
