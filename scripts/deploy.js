/**
 * Déploiement production NestFind : `npm run deploy`
 *
 * Étapes :
 *   1. git push origin main + git push jacques main  (Vercel déploie le front
 *      automatiquement depuis le remote "jacques") — sauté avec --no-push
 *   2. SSH sur le VPS : git pull + npm install + pm2 restart nestfind-backend
 *   3. Health checks : API directe sur le VPS puis via le proxy Vercel
 *
 * Les identifiants SSH sont lus depuis VPS_ACCESS.md (jamais affichés).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('ssh2');

const ROOT = path.resolve(__dirname, '..');
const VPS_ACCESS = path.join(ROOT, 'VPS_ACCESS.md');
const NO_PUSH = process.argv.includes('--no-push');

// Commande exécutée sur le VPS (backend dans /opt/nestfind/backend,
// process PM2 = nestfind-backend — pas "nestfind-api" comme indiqué
// dans VPS_ACCESS.md).
const REMOTE_CMD = [
  'cd /opt/nestfind',
  'git pull --ff-only',
  'cd backend',
  'npm install --omit=dev',
  'pm2 restart nestfind-backend --update-env',
  'sleep 2',
  'curl -s -o /dev/null -w "health local: %{http_code}\\n" http://localhost:5001/api/health',
  'pm2 status nestfind-backend',
].join(' && ');

function step(title) {
  console.log(`\n${'='.repeat(60)}\n== ${title}\n${'='.repeat(60)}`);
}

function parseCredentials(file) {
  const text = fs.readFileSync(file, 'utf8');
  const grab = (label) => {
    const m = text.match(new RegExp(`\\*\\*${label}\\*\\*\\s*:\\s*\`([^\`]+)\``, 'i'));
    return m ? m[1].trim() : null;
  };
  const host = grab('Adresse IP') || grab('Hostname');
  const username = grab('Utilisateur') || 'root';
  const password = grab('Mot de passe');
  if (!host || !password) {
    throw new Error(`Identifiants introuvables dans ${file}`);
  }
  return { host, username, password };
}

function sshExec({ host, username, password }, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => {
        console.log(`[SSH] Connecté à ${username}@${host}\n`);
        conn.exec(command, { pty: false }, (err, stream) => {
          if (err) return reject(err);
          stream
            .on('close', (code) => {
              conn.end();
              code === 0 ? resolve() : reject(new Error(`Commande VPS échouée (code ${code})`));
            })
            .on('data', (d) => process.stdout.write(d.toString()))
            .stderr.on('data', (d) => process.stderr.write(d.toString()));
        });
      })
      .on('error', reject)
      .connect({ host, port: 22, username, password, readyTimeout: 20000 });
  });
}

async function checkHealth(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const ok = res.ok;
    console.log(`${ok ? 'OK ' : 'KO '} ${label}: HTTP ${res.status} — ${url}`);
    return ok;
  } catch (e) {
    console.log(`KO  ${label}: ${e.message} — ${url}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(VPS_ACCESS)) {
    throw new Error('VPS_ACCESS.md introuvable — impossible de déployer sans identifiants.');
  }

  if (!NO_PUSH) {
    step('1/3 — Push GitHub (origin + jacques → déclenche Vercel)');
    execSync('git push origin main', { cwd: ROOT, stdio: 'inherit' });
    execSync('git push jacques main', { cwd: ROOT, stdio: 'inherit' });
  } else {
    step('1/3 — Push GitHub : ignoré (--no-push)');
  }

  step('2/3 — VPS : pull + install + restart PM2');
  await sshExec(parseCredentials(VPS_ACCESS), REMOTE_CMD);

  step('3/3 — Health checks');
  const { host } = parseCredentials(VPS_ACCESS);
  const okVps = await checkHealth(`http://${host}:3001/api/health`, 'API via Nginx (VPS)');
  const okVercel = await checkHealth('https://neststayy.vercel.app/api/health', 'API via proxy Vercel');

  step('Résultat');
  if (okVps && okVercel) {
    console.log('Déploiement OK — backend VPS + proxy Vercel répondent.');
  } else if (okVps) {
    console.log('Backend VPS OK, mais le proxy Vercel ne répond pas encore (le front rebuild peut prendre ~1 min).');
  } else {
    console.log('Le backend ne répond pas — vérifier : npm run vps -- "pm2 logs nestfind-backend --lines 50"');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\n[DEPLOY] Échec:', e.message);
  process.exit(1);
});
