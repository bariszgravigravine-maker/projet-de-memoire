import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Service Mistral AI — Agent virtuel immobilier.
 *
 * Rôle : convertir un prompt en langage naturel (ex: "cherche moi une maison
 * située à Bonas, 3 chambres, 2 douches, moins chère") en un objet JSON
 * structuré consommable par le moteur de recherche du backend.
 */
export const MistralService = {
  /**
   * Convertit un message utilisateur en critères de recherche JSON.
   * @param {string} userMessage - Le prompt en langage naturel.
   * @returns {Promise<Object>} Critères structurés.
   */
  async parseSearchQuery(userMessage) {
    const systemPrompt = `Tu es un assistant immobilier spécialisé dans le marché camerounais.
Ton rôle est de convertir la demande de l'utilisateur en un objet JSON strictement structuré
que le backend pourra consommer pour effectuer une recherche en base de données.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans markdown.

Format attendu :
{
  "type": "maison" | "appartement" | "studio" | "chambre" | "villa" | "terrain" | null,
  "city": "nom de la ville" | null,
  "district": "nom du quartier" | null,
  "near": "lieu repère (ex: ngoa ekele, bonas, bastos)" | null,
  "bedroomsMin": nombre | null,
  "bathroomsMin": nombre | null,
  "priceMin": nombre | null,
  "priceMax": nombre | null,
  "sortBy": "price_asc" | "price_desc" | "recent" | null,
  "radiusKm": nombre | null
}

Règles :
- "moins chère" ou "pas cher" => sortBy = "price_asc"
- "près de" / "pas loin de" / "proche de" => remplir "near" et mettre radiusKm = 5
- Si l'utilisateur ne précise pas un champ, mets null.
- Les nombres doivent être des entiers, pas des chaînes.
- Ne renvoie aucun texte hors du JSON.`;

    const payload = {
      model: config.mistral.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 500,
    };

    try {
      const res = await axios.post(config.mistral.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const raw = res.data.choices[0].message.content.trim();
      // Extraction robuste du JSON (au cas où Mistral ajoute du texte)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Réponse Mistral sans JSON exploitable');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return this.normalizeCriteria(parsed);
    } catch (err) {
      console.error('[Mistral] Erreur parseSearchQuery:', err.message);
      if (err.response) {
        console.error('[Mistral] Statut:', err.response.status, 'Data:', JSON.stringify(err.response.data));
      }
      throw new Error('Impossible d\'analyser la demande avec l\'IA');
    }
  },

  /**
   * Normalise les critères reçus de Mistral vers le format attendu par PropertyModel.search.
   */
  normalizeCriteria(raw) {
    const c = {
      type: raw.type || null,
      city: raw.city || null,
      district: raw.district || null,
      near: raw.near || null,
      bedroomsMin: this.toInt(raw.bedroomsMin),
      bathroomsMin: this.toInt(raw.bathroomsMin),
      priceMin: this.toInt(raw.priceMin),
      priceMax: this.toInt(raw.priceMax),
      sortBy: raw.sortBy || null,
      radiusKm: this.toInt(raw.radiusKm),
    };
    return c;
  },

  toInt(v) {
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  },

  /**
   * Génère une description d'annonce à partir des caractéristiques.
   */
  async generateAdDescription({ type, area, bedrooms, bathrooms, city, district, price }) {
    const systemPrompt = `Tu es un rédacteur immobilier professionnel. Rédige une description d'annonce
attrayante en français, de 3 à 5 phrases, à partir des caractéristiques fournies.
Ne mentionne pas le prix dans la description. Réponds uniquement avec le texte de la description.`;

    const userContent = `Type: ${type}, Surface: ${area} m², Chambres: ${bedrooms}, Douches/SDB: ${bathrooms},
Ville: ${city}, Quartier: ${district}, Prix: ${price} FCFA`;

    try {
      const res = await axios.post(config.mistral.apiUrl, {
        model: config.mistral.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Mistral] Erreur generateAdDescription:', err.message);
      throw new Error('Impossible de générer la description');
    }
  },

  /**
   * Analyse une image (ou plusieurs) avec le modèle de vision Pixtral.
   * @param {string|Array<string>} images - URL(s) ou data URI(s) base64.
   * @param {string} [prompt] - Question/instruction en langage naturel.
   * @returns {Promise<string>} Description textuelle renvoyée par l'IA.
   */
  async analyzeImage(images, prompt) {
    const imageList = Array.isArray(images) ? images : [images];
    if (imageList.length === 0) {
      const err = new Error('Aucune image fournie');
      err.status = 400;
      throw err;
    }

    const userContent = [
      { type: 'text', text: prompt || "Décris cette image immobilière en détail : type de bien, état, pièces visibles, style architectural, couleurs, environnement." },
      ...imageList.map((url) => ({ type: 'image_url', image_url: url })),
    ];

    try {
      const res = await axios.post(config.mistral.apiUrl, {
        model: config.mistral.visionModel,
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.3,
        max_tokens: 800,
      }, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      });
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Mistral] Erreur analyzeImage:', err.message);
      if (err.response) {
        console.error('[Mistral] Statut:', err.response.status, 'Data:', JSON.stringify(err.response.data));
      }
      throw new Error("Impossible d'analyser l'image avec l'IA");
    }
  },

  /**
   * Analyse une image et renvoie un objet JSON structuré (type, chambres, état...).
   * @param {string|Array<string>} images - URL(s) ou data URI(s) base64.
   * @returns {Promise<Object>} Caractéristiques extraites.
   */
  async extractPropertyFeatures(images) {
    const imageList = Array.isArray(images) ? images : [images];
    const systemPrompt = `Tu es un expert immobilier. Analyse cette image et renvoie UNIQUEMENT un objet JSON valide avec ce format :
{
  "property_type": "maison" | "appartement" | "studio" | "villa" | "terrain" | null,
  "estimated_bedrooms": nombre | null,
  "estimated_bathrooms": nombre | null,
  "condition": "neuf" | "bon" | "à rénover" | null,
  "style": "moderne" | "traditionnel" | "contemporain" | "tropical" | null,
  "has_pool": true | false,
  "has_garden": true | false,
  "has_garage": true | false,
  "has_balcony": true | false,
  "has_terrace": true | false,
  "description": "description courte en français"
}
Ne renvoie aucun texte hors du JSON.`;

    const userContent = [
      { type: 'text', text: systemPrompt },
      ...imageList.map((url) => ({ type: 'image_url', image_url: url })),
    ];

    try {
      const res = await axios.post(config.mistral.apiUrl, {
        model: config.mistral.visionModel,
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.1,
        max_tokens: 600,
      }, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      });
      const raw = res.data.choices[0].message.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Réponse vision sans JSON exploitable');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('[Mistral] Erreur extractPropertyFeatures:', err.message);
      if (err.response) {
        console.error('[Mistral] Statut:', err.response.status, JSON.stringify(err.response.data));
      }
      throw new Error("Impossible d'extraire les caractéristiques du bien");
    }
  },

  /**
   * Réponse conversationnelle de l'agent IA après une recherche par image.
   * Décrit d'abord ce que l'IA voit dans l'image, puis présente les biens trouvés.
   */
  async buildImageSearchResponse(imageDescription, features, results, criteria) {
    const systemPrompt = `Tu es un agent immobilier virtuel au Cameroun. L'utilisateur t'a envoyé une image d'un bien immobilier.
Tu as reçu :
1. Une description détaillée de ce que l'IA voit dans l'image.
2. Les caractéristiques extraites de l'image.
3. Les résultats RÉELS de la recherche en base de données.

STRUCTURE OBLIGATOIRE DE TA RÉPONSE :
1. Commence par décrire ce que tu vois dans l'image en te basant sur la description fournie. Sois descriptif et naturel, comme si tu regardais l'image avec l'utilisateur. Mentionne le type de bien, le style, l'état, les pièces visibles, l'environnement, etc.
2. Ensuite, fais une transition naturelle vers les propositions (ex: "D'après ce que je vois, voici les biens similaires disponibles :").
3. Présente UNIQUEMENT les biens réellement trouvés dans les résultats, avec leurs informations exactes (titre, prix, ville, quartier, chambres).

RÈGLES CRITIQUES :
- Ne JAMAIS inventer ou lister des biens qui ne figurent pas dans les résultats fournis.
- Si AUCUN bien n'a été trouvé, dis-le clairement après la description et propose d'élargir la recherche.
- Sois concis, amical et honnête.
- La description de l'image doit faire 3 à 5 phrases.`;

    const resultsSummary = results.length === 0
      ? 'Aucun bien ne correspond aux critères extraits de l\'image.'
      : results.slice(0, 8).map(r =>
          `- ${r.title} | ${r.price} FCFA | ${r.city}, ${r.district || 'quartier non précisé'} | ${r.bedrooms || 0} chambres`
        ).join('\n');

    const userContent = `Description de l'image par l'IA :
${imageDescription}

Caractéristiques extraites :
- Type : ${features.property_type || 'non déterminé'}
- Chambres estimées : ${features.estimated_bedrooms || '?'}
- Douches/SDB : ${features.estimated_bathrooms || '?'}
- État : ${features.condition || 'non déterminé'}
- Style : ${features.style || 'non déterminé'}

Résultats de recherche (${results.length} au total) :
${resultsSummary}`;

    try {
      const res = await axios.post(config.mistral.apiUrl, {
        model: config.mistral.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Mistral] Erreur buildImageSearchResponse:', err.message);
      // Fallback: description + résultats simples
      let fallback = `Voici ce que je vois dans votre image :\n${imageDescription}\n\n`;
      if (results.length === 0) {
        fallback += `Je n'ai trouvé aucun bien correspondant à cette image dans notre base. Essayez avec d'autres critères.`;
      } else {
        fallback += `Voici les biens similaires disponibles :\n${resultsSummary}`;
      }
      return fallback;
    }
  },

  /**
   * Réponse conversationnelle de l'agent IA après une recherche.
   */
  async buildSearchResponse(userMessage, results, criteria) {
    const systemPrompt = `Tu es un agent immobilier virtuel au Cameroun. L'utilisateur t'a demandé de chercher un bien.
Tu as reçu les résultats RÉELS de la recherche en base de données.

RÈGLES CRITIQUES :
- Si AUCUN bien n'a été trouvé, dis clairement "Je n'ai trouvé aucun bien correspondant à vos critères." puis propose d'élargir la recherche.
- Ne JAMAIS inventer ou lister des biens qui ne figurent pas dans les résultats fournis.
- Ne JAMAIS dire "Voici les biens qui correspondent" si la liste est vide.
- Présente UNIQUEMENT les biens réellement trouvés, avec leurs informations exactes (titre, prix, ville, quartier, chambres).
- Sois concis, amical et honnête.`;

    const resultsSummary = results.length === 0
      ? 'Aucun bien ne correspond aux critères.'
      : results.slice(0, 8).map(r =>
          `- ${r.title} | ${r.price} FCFA | ${r.city}, ${r.district || 'quartier non précisé'} | ${r.bedrooms || 0} chambres`
        ).join('\n');

    const userContent = `Demande utilisateur: "${userMessage}"
Critères extraits: ${JSON.stringify(criteria)}
Résultats (${results.length} au total):
${resultsSummary}`;

    try {
      const res = await axios.post(config.mistral.apiUrl, {
        model: config.mistral.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }, {
        headers: {
          'Authorization': `Bearer ${config.mistral.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Mistral] Erreur buildSearchResponse:', err.message);
      // Fallback: réponse simple sans IA
      if (results.length === 0) {
        return `Je n'ai trouvé aucun bien correspondant à votre recherche. Essayez d'élargir vos critères (zone, budget, nombre de chambres).`;
      }
      return `J'ai trouvé ${results.length} bien(s) correspondant à votre recherche :\n${resultsSummary}`;
    }
  },
};

export default MistralService;
