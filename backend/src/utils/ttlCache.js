/**
 * Cache mémoire simple avec expiration (TTL) et taille maximale.
 *
 * Objectif : éviter de rappeler l'API Mistral pour une question déjà posée
 * ("je cherche une maison à Bastos" tapée deux fois de suite, ou par deux
 * utilisateurs). Un appel Mistral coûte ~1-2 s : le cache divise ce temps
 * par ~50 sur les requêtes répétées.
 *
 * Note : cache par instance Node (suffisant ici, l'API tourne en un seul
 * process PM2). Pour un cluster, remplacer par Redis.
 */
export function createTtlCache({ ttlMs = 5 * 60 * 1000, maxSize = 500 } = {}) {
  const store = new Map();

  const isExpired = (entry) => Date.now() - entry.at > ttlMs;

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        store.delete(key);
        return undefined;
      }
      // LRU : on replace l'entrée en fin de Map
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },

    set(key, value) {
      if (store.has(key)) store.delete(key);
      store.set(key, { value, at: Date.now() });
      // Éviction des plus anciennes entrées
      while (store.size > maxSize) {
        const oldest = store.keys().next().value;
        store.delete(oldest);
      }
      return value;
    },

    /** get, sinon calcule puis met en cache (déduplique aussi les appels concurrents). */
    async wrap(key, factory) {
      const cached = this.get(key);
      if (cached !== undefined) return cached;

      // Si un calcul identique est déjà en cours, on attend le même résultat
      const pending = inflight.get(key);
      if (pending) return pending;

      const promise = (async () => {
        try {
          const value = await factory();
          this.set(key, value);
          return value;
        } finally {
          inflight.delete(key);
        }
      })();
      inflight.set(key, promise);
      return promise;
    },

    get size() {
      return store.size;
    },

    clear() {
      store.clear();
    },
  };
}

// Requêtes en vol, partagées par toutes les instances de cache
const inflight = new Map();

export default createTtlCache;
