/** @type {import('../lib/types.js').Endpoint[]} */
export const experioEndpoints = [
  { name: 'exp:countries', path: () => '/experio-builder/countries' },
  { name: 'exp:sitemaps', needs: ['leId'], path: (p) => `/experio-builder/sitemaps?leId=${p('leId')}` },
  { name: 'exp:point', needs: ['sitemapId'], path: (p) => `/experio-builder/point?sitemapId=${p('sitemapId')}` },
  { name: 'exp:phases', needs: ['pointId'], path: (p) => `/experio-builder/phases?pointId=${p('pointId')}` },
  { name: 'exp:steps', needs: ['phaseId'], path: (p) => `/experio-builder/steps?phaseId=${p('phaseId')}` },
  { name: 'exp:sitemap/:id', needs: ['sitemapId'], path: (p) => `/experio-builder/sitemap/${p('sitemapId')}` },
  { name: 'exp:point/:id', needs: ['pointId'], path: (p) => `/experio-builder/point/${p('pointId')}` },
  { name: 'exp:step/:id', needs: ['stepId'], path: (p) => `/experio-builder/step/${p('stepId')}` },
  { name: 'exp:questionbank', needs: ['leId'], path: (p) => `/experio-builder/questionbank?leId=${p('leId')}` },
  { name: 'exp:block/lesson/:phaseId', needs: ['phaseId'], path: (p) => `/experio-builder/block/lesson/${p('phaseId')}` },
  { name: 'exp:detailfirstphase/:id', needs: ['leId'], path: (p) => `/experio-builder/detailfirstphase/${p('leId')}` },
  {
    name: 'exp:learner.experio',
    needs: ['lessonId', 'sessionId'],
    path: (p) => `/experio-builder/learner/experios/${p('lessonId')}/sessions/${p('sessionId')}`,
  },
];
