// Test Mistral vision avec mistral-small-latest
import axios from 'axios';

const API_KEY = 'b9YzNpdlTrj3VLBO4DjcrJfAtCGBjDz0';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

async function testVisionWithURL() {
  console.log('=== Test 1: Vision avec URL publique ===\n');
  
  const payload = {
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "Décris ce que tu vois dans cette image. S'agit-il d'une maison ? Combien de pièces visibles ? Décris le style architectural." },
          { type: 'image_url', image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d8e6?w=800' }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
  };

  try {
    const res = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    console.log('Status:', res.status);
    console.log('Réponse:', res.data.choices[0].message.content);
    console.log('\nTokens utilisés:', JSON.stringify(res.data.usage));
    return true;
  } catch (err) {
    console.error('ERREUR:', err.response?.status || err.code);
    console.error('Détails:', JSON.stringify(err.response?.data || err.message));
    return false;
  }
}

async function testVisionWithBase64() {
  console.log('\n=== Test 2: Vision avec image base64 (téléchargée) ===\n');
  
  // Télécharger une image et la convertir en base64
  const imageUrl = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';
  
  try {
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const base64 = Buffer.from(imgRes.data).toString('base64');
    const mimeType = imgRes.headers['content-type'] || 'image/jpeg';
    console.log(`Image téléchargée: ${base64.length} chars base64, type: ${mimeType}`);
    
    const payload = {
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "Décris cette image immobilière en détail. Quel type de bien vois-tu ?" },
            { type: 'image_url', image_url: `data:${mimeType};base64,${base64}` }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    };

    const res = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    console.log('Status:', res.status);
    console.log('Réponse:', res.data.choices[0].message.content);
    console.log('\nTokens utilisés:', JSON.stringify(res.data.usage));
    return true;
  } catch (err) {
    console.error('ERREUR:', err.response?.status || err.code);
    console.error('Détails:', JSON.stringify(err.response?.data || err.message));
    return false;
  }
}

async function testCodestralNoVision() {
  console.log('\n=== Test 3: codestral-latest (texte seul, pas de vision) ===\n');
  
  const payload = {
    model: 'codestral-latest',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "Décris cette image." },
          { type: 'image_url', image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d8e6?w=800' }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 300,
  };

  try {
    const res = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    console.log('Status:', res.status);
    console.log('Réponse:', res.data.choices[0].message.content);
    return true;
  } catch (err) {
    console.error('ERREUR:', err.response?.status || err.code);
    console.error('Détails:', JSON.stringify(err.response?.data || err.message));
    return false;
  }
}

async function main() {
  console.log('Test de vision Mistral AI');
  console.log('==========================\n');
  
  // Test 1: mistral-small-latest avec URL
  const t1 = await testVisionWithURL();
  
  // Test 2: mistral-small-latest avec base64
  const t2 = await testVisionWithBase64();
  
  // Test 3: codestral-latest (devrait échouer ou halluciner)
  const t3 = await testCodestralNoVision();
  
  console.log('\n==========================');
  console.log('RÉSUMÉ:');
  console.log('  mistral-small-latest (URL):    ', t1 ? 'OK' : 'ÉCHEC');
  console.log('  mistral-small-latest (base64): ', t2 ? 'OK' : 'ÉCHEC');
  console.log('  codestral-latest (vision):     ', t3 ? 'OK' : 'ÉCHEC (attendu)');
}

main().catch(console.error);
