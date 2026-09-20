# NestFind — notes projet

## Workflow de déploiement (OBLIGATOIRE après chaque modification)

Après chaque modification du code, toujours déployer en production :

1. Commit + push sur les DEUX remotes :
   - `git push origin main` (bariszgravigravine-maker)
   - `git push jacques main` (jacquesngono-art — connecté à Vercel, déploie le front automatiquement)
2. Mettre à jour le VPS (backend) :
   - `npm run deploy` (push + VPS + health checks) ou `npm run deploy:no-push` si le push est déjà fait
   - Le script fait : `git pull` dans `/opt/nestfind`, `npm install --omit=dev` dans `backend/`, `pm2 restart nestfind-backend`, puis health checks
   - Process PM2 = `nestfind-backend` (pas `nestfind-api` comme indiqué dans VPS_ACCESS.md)

## Infrastructure

- Front : Next.js 16 sur Vercel (https://neststayy.vercel.app)
- Backend : Node/Express + PM2 sur VPS LWS (185.98.128.123), Nginx port public 3001
- DB : PostgreSQL `immo_db` sur le VPS — user `immo` (identifiants dans `backend/.env` du VPS)
- Commande SSH ad hoc : `npm run vps -- "<commande>"` ou `node scripts/ssh-run.js @script.sh`
- psql sur le VPS : `export PGPASSWORD='...' ; psql -h 127.0.0.1 -U immo -d immo_db` (le peer auth échoue en root, passer par TCP)

## Données

- La base ne contient que des biens du grand Yaoundé (+ Mfou) — le reste a été supprimé (20/09/2026)
- La map 3D est bornée à cette zone via `maxBounds` dans `front/components/property-3d-map.tsx`
- Si le style/clé MapTiler change dans `property-3d-map.tsx`, mettre à jour le `<link rel="preload">` correspondant dans `front/app/layout.tsx`

## Vérification

- Front : `cd front && npm run build`
