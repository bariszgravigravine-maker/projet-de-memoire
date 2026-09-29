// Génère comptes-test.pdf — liste des comptes seedés NestFind.
// PDF minimaliste sans dépendance (police standard Courier, encodage WinAnsi).
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'comptes-test.pdf');

const LINES = [
  ['t', 'NestFind — Comptes de test (base de production)'],
  ['n', ''],
  ['n', 'Deux roles seulement : ADMIN (plateforme) et USER (tous les utilisateurs).'],
  ['n', 'Mot de passe : ADMIN = admin123, ex-agents = agent123, USER = user123'],
  ['n', ''],
  ['h', 'ADMIN'],
  ['r', 'admin@immo.cm | admin123 | Admin Systeme'],
  ['n', ''],
  ['h', 'UTILISATEURS PROPRIETAIRES - ex-agents (mot de passe : agent123)'],
  ['r', 'agent@immo.cm | Kamga Paul'],
  ['r', 'ndongo@immo.cm | Ndongo Marie'],
  ['r', 'aisha.toumba@immo.cm | Aisha Toumba'],
  ['r', 'sandrine.foka@immo.cm | Sandrine Foka'],
  ['r', 'agent.yaounde0@immo.cm | Mbarga Serge'],
  ['r', 'agent.douala1@immo.cm | Suzanne Laurent'],
  ['r', 'agent.bafoussam2@immo.cm | Moussa Samuel'],
  ['r', 'agent.bamenda3@immo.cm | Brice Thomas'],
  ['r', 'agent.garoua4@immo.cm | Paul Joseph'],
  ['r', 'agent.kribi5@immo.cm | Ekane Patrick'],
  ['r', 'agent.buea6@immo.cm | Toumba Jacques'],
  ['r', 'agent.limbe7@immo.cm | Foka Serge'],
  ['r', 'agent.bertoua8@immo.cm | Suzanne Francois'],
  ['r', 'agent.maroua9@immo.cm | Issa Marc'],
  ['r', 'agent.ngaoundere10@immo.cm | Atangana Pierre'],
  ['r', 'agent.ebolowa11@immo.cm | Nadege Marie'],
  ['r', 'agent.aristide.mbarga@immo.cm | Aristide Mbarga'],
  ['r', 'agent.benoit.talla@immo.cm | Benoit Talla'],
  ['r', 'agent.christelle.fouda@immo.cm | Christelle Fouda'],
  ['r', 'agent.clarisse.eyenga@immo.cm | Clarisse Eyenga'],
  ['r', 'agent.ghislain.nkomo@immo.cm | Ghislain Nkomo'],
  ['r', 'agent.mireille.abanda@immo.cm | Mireille Abanda'],
  ['r', 'agent.nadege.mballa@immo.cm | Nadege Mballa'],
  ['r', 'agent.serge.ngono@immo.cm | Serge Ngono'],
  ['n', ''],
  ['h', 'UTILISATEURS (mot de passe : user123)'],
  ['r', 'user@immo.cm | Atangana Fredy'],
  ['r', 'brice.ekane@immo.cm | Brice Ekane'],
  ['r', 'mireille.nkomo@immo.cm | Mireille Nkomo'],
  ['r', 'jeanpaul.biya@immo.cm | Jean-Paul Biya Jr'],
  ['r', 'wilfried.kamga@immo.cm | Wilfried Kamga'],
  ['r', 'user.aicha.bello@immo.cm | Aicha Bello'],
  ['r', 'user.bernadette.ayissi@immo.cm | Bernadette Ayissi'],
  ['r', 'user.bertrand.kamdem@immo.cm | Bertrand Kamdem'],
  ['r', 'user.chantal.ngo bassong@immo.cm | Chantal Ngo Bassong'],
  ['r', 'user.estelle.mvondo@immo.cm | Estelle Mvondo'],
  ['r', 'user.herve.djoumessi@immo.cm | Herve Djoumessi'],
  ['r', 'user.olivier.manga@immo.cm | Olivier Manga'],
  ['r', 'user.rodrigue.essomba@immo.cm | Rodrigue Essomba'],
  ['r', 'user.suzanne.ndoumbe@immo.cm | Suzanne Ndoumbe'],
  ['r', 'user.yannick.fotso@immo.cm | Yannick Fotso'],
];

// Construction du flux de texte (BT/ET), Courier 10pt, interligne 13pt.
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
let y = 770;
let stream = 'BT\n';
for (const [kind, text] of LINES) {
  const size = kind === 't' ? 14 : kind === 'h' ? 11 : 9;
  const lead = kind === 't' ? 20 : kind === 'h' ? 16 : 13;
  y -= lead;
  // Tm = matrice de texte absolue (chaque ligne est positionnée depuis
  // l'origine — pas de dérive horizontale comme avec Td+Tj).
  stream += `/F1 ${size} Tf 1 0 0 1 50 ${y} Tm (${esc(text)}) Tj\n`;
}
stream += 'ET\n';
const streamBuf = Buffer.from(stream, 'latin1');

const objects = [];
objects.push('<< /Type /Catalog /Pages 2 0 R >>');
objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
objects.push(`<< /Length ${streamBuf.length} >>\nstream\n${streamBuf.toString('latin1')}\nendstream`);

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefPos = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

fs.writeFileSync(OUT, Buffer.from(pdf, 'latin1'));
console.log('PDF écrit :', OUT);
