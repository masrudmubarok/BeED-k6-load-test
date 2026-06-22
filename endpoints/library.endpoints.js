// Declarative endpoint registry for Unified Library API (proxied via Gatekeeper).
import { qs } from '../lib/data.js';

/** @type {import('../lib/types.js').Endpoint[]} */
export const libraryEndpoints = [
  { name: 'lib:types/template', path: () => '/library/types/template' },
  { name: 'lib:active-curriculum', path: () => '/library/active-curriculum' },
  { name: 'lib:school/report-years', path: () => '/library/school/report-years' },
  { name: 'lib:school/branch-schools', path: () => '/library/school/branch-schools' },
  { name: 'lib:school/:id/active-curriculum', needs: ['schoolId'], path: (p) => `/library/school/${p('schoolId')}/active-curriculum` },
  { name: 'lib:search.suggest', path: (p, term) => `/library/search/suggestions${qs({ q: term() })}` },
  { name: 'lib:search', path: (p, term) => `/library/search${qs({ q: term() })}` },
  { name: 'lib:admin.account.items', path: () => '/library/admin/account/items' },
  { name: 'lib:admin.account.suggest', path: (p, term) => `/library/admin/account/items/search/suggestions${qs({ q: term() })}` },
  { name: 'lib:admin.account.authors', path: () => '/library/admin/account/authors' },
  { name: 'lib:admin.account.details', needs: ['accountItemId'], path: (p) => `/library/admin/account/items/${p('accountItemId')}/details` },
  { name: 'lib:educators.account.items', path: () => '/library/educators/account/items' },
  { name: 'lib:admin.private.items', path: () => '/library/admin/private/items' },
  { name: 'lib:admin.private.folder.items', needs: ['folderId'], path: (p) => `/library/admin/private/folders/${p('folderId')}/items` },
  { name: 'lib:admin.assigned.items', path: () => '/library/admin/assigned/items' },
  { name: 'lib:lesson-plans.blocks', needs: ['lessonPlanId'], path: (p) => `/library/educators/lesson-plans/${p('lessonPlanId')}/blocks` },
  { name: 'lib:lesson-plans.unit-plan', needs: ['lessonPlanId'], path: (p) => `/library/educators/lesson-plans/${p('lessonPlanId')}/unit-plan` },
  { name: 'lib:lesson-plans.params', path: () => '/library/educators/lesson-plans/entity-types/unit-plan-params' },
];
