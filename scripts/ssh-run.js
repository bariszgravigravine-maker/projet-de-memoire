/**
 * Exécute une commande shell sur le VPS NestFind via SSH.
 * Les identifiants sont lus depuis VPS_ACCESS.md (jamais passés en argument,
 * jamais affichés).
 *
 * Usage :
 *   node scripts/ssh-run.js "commande shell"
 *   node scripts/ssh-run.js @chemin/vers/script.sh   (fichier lu, CRLF -> LF)
 *   npm run vps -- "pm2 status"
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VPS_ACCESS = process.argv[3] || path.join(PROJECT_ROOT, 'VPS_ACCESS.md');
let COMMAND = process.argv[2];

// "@chemin" => la commande est lue depuis un fichier (évite les soucis de
// quoting entre PowerShell et bash)
if (COMMAND && COMMAND.startsWith('@')) {
  const file = path.resolve(PROJECT_ROOT, COMMAND.slice(1));
  COMMAND = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

if (!COMMAND) {
  console.error('Usage: node scripts/ssh-run.js "<commande>" | @script.sh');
  process.exit(1);
}

function parseCredentials(file) {
  const text = fs.readFileSync(file, 'utf8');
  const grab = (label) => {
    const re = new RegExp(`\\*\\*${label}\\*\\*\\s*:\\s*\`([^\`]+)\``, 'i');
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };
  const host = grab('Adresse IP') || grab('Hostname');
  const username = grab('Utilisateur') || 'root';
  const password = grab('Mot de passe');
  if (!host || !password) throw new Error('Identifiants VPS introuvables dans ' + file);
  return { host, username, password };
}

const { host, username, password } = parseCredentials(VPS_ACCESS);
console.log(`[SSH] Connexion à ${username}@${host} ...`);

const conn = new Client();
conn
  .on('ready', () => {
    console.log('[SSH] Connecté. Exécution...\n');
    conn.exec(COMMAND, { pty: false }, (err, stream) => {
      if (err) {
        console.error('[SSH] Erreur exec:', err.message);
        conn.end();
        process.exit(1);
      }
      stream
        .on('close', (exitCode) => {
          console.log(`\n[SSH] Terminé (code ${exitCode}).`);
          conn.end();
          process.exit(exitCode === 0 ? 0 : 1);
        })
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
  })
  .on('error', (err) => {
    console.error('[SSH] Erreur de connexion:', err.message);
    process.exit(1);
  })
  .connect({
    host,
    port: 22,
    username,
    password,
    readyTimeout: 20000,
  });
