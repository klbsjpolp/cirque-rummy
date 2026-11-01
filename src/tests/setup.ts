/**
 * Ce que jsdom ne fournit pas et que l'application utilise.
 *
 * `window.matchMedia` n'existe pas dans jsdom ; les notifications (sonner) s'en
 * servent pour suivre le thème du système. Sans ce bouchon, tout test qui monte les
 * notifications échoue — alors que rien n'est cassé dans un vrai navigateur.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
