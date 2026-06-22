import { qs, randInt } from '../lib/data.js';

const PAGE_SIZE = 20; // Hub-API default page size
const page = () => randInt(1, 3); // vary the page so OFFSET/LIMIT plans get exercised
// First-load defaults the UI sends for hub lists (ALL/all = the full, heaviest query).
const listParams = (ownerId) => qs({ ownerId, hubRelation: 'ALL', status: 'all', page: page(), pageSize: PAGE_SIZE });
const roomListParams = () => qs({ page: page(), pageSize: PAGE_SIZE });

/** @type {import('../lib/types.js').Endpoint[]} */
export const hubEndpoints = [
  { name: 'hub:data', path: () => '/hub/data' },

  // ── Learner hubs ─────────────────────────────────────────────────────────
  { name: 'hub:learners/hubs', needs: ['ownerId'], path: (p) => `/hub/learners/hubs${listParams(p('ownerId'))}` },
  {
    name: 'hub:learners.suggest',
    needs: ['ownerId'],
    path: (p, term) => `/hub/learners/hubs/search/suggestions${qs({ ownerId: p('ownerId'), q: term() })}`
  },
  { name: 'hub:learners/hubs/:id', needs: ['hubId'], path: (p) => `/hub/learners/hubs/${p('hubId')}` },
  { name: 'hub:learners.rooms', needs: ['hubId'], path: (p) => `/hub/learners/hubs/${p('hubId')}/rooms` },
  {
    name: 'hub:learners.room.experios',
    needs: ['hubId', 'roomId'],
    path: (p) => `/hub/learners/hubs/${p('hubId')}/rooms/${p('roomId')}/experios${qs({ sort: 'latest_start', order: 'desc', page: page(), pageSize: PAGE_SIZE })}`
  },
  {
    name: 'hub:learners.room.learners',
    needs: ['hubId', 'roomId'],
    path: (p) => `/hub/learners/hubs/${p('hubId')}/rooms/${p('roomId')}/learners${roomListParams()}`
  },
  {
    name: 'hub:learners.room.educators',
    needs: ['hubId', 'roomId'],
    path: (p) => `/hub/learners/hubs/${p('hubId')}/rooms/${p('roomId')}/educators${roomListParams()}`
  },

  // ── Admin hubs ───────────────────────────────────────────────────────────
  { name: 'hub:admin/hubs', needs: ['ownerId'], path: (p) => `/hub/admin/hubs${listParams(p('ownerId'))}` },
  {
    name: 'hub:admin.suggest',
    needs: ['ownerId'],
    path: (p, term) => `/hub/admin/hubs/search/suggestions${qs({ ownerId: p('ownerId'), q: term() })}`
  },
  {
    name: 'hub:admin/hubs/:id',
    needs: ['hubId', 'ownerId'],
    path: (p) => `/hub/admin/hubs/${p('hubId')}${qs({ ownerId: p('ownerId') })}`
  },
  { name: 'hub:admin.summary', needs: ['hubId'], path: (p) => `/hub/admin/hubs/${p('hubId')}/summary` },
  { name: 'hub:admin.rooms', needs: ['hubId'], path: (p) => `/hub/admin/hubs/${p('hubId')}/rooms` },

  // ── Educator hubs ────────────────────────────────────────────────────────
  { name: 'hub:educators/hubs', needs: ['ownerId'], path: (p) => `/hub/educators/hubs${listParams(p('ownerId'))}` },
  {
    name: 'hub:educators/hubs/:id',
    needs: ['hubId', 'ownerId'],
    path: (p) => `/hub/educators/hubs/${p('hubId')}${qs({ ownerId: p('ownerId') })}`
  },
  { name: 'hub:educators.summary', needs: ['hubId'], path: (p) => `/hub/educators/hubs/${p('hubId')}/summary` },
  { name: 'hub:educators.rooms', needs: ['hubId'], path: (p) => `/hub/educators/hubs/${p('hubId')}/rooms` },

  // ── Session results & annotation ─────────────────────────────────────────
  { name: 'hub:sessionresult', needs: ['roomId', 'leId'], path: (p) => `/hub/hubs/sessionresult/${p('roomId')}/${p('leId')}` },
  {
    name: 'hub:sessionresult.user',
    needs: ['roomId', 'leId', 'sessionUserId'],
    path: (p) => `/hub/hubs/sessionresult/${p('roomId')}/${p('leId')}/${p('sessionUserId')}`
  },
  { name: 'hub:annotation', needs: ['attachmentId'], path: (p) => `/hub/hubs/annotation/${p('attachmentId')}` },
];
