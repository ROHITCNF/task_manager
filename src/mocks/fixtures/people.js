/**
 * Mock server data in the API wire format (docs/lld/api/openapi.yaml).
 * Reproduces the reference screenshots (settings_light.png, home_light.png, taskboard_light.png).
 *
 * User ids were chosen so the UI's avatar colour hash (src/domain/avatar.js) lands on the colour
 * seen in the reference for each initial-letter avatar.
 */

export const USERS = {
  neeraj:     { id: 'usr_01J8Z001000000000000000008', name: 'Neeraj Bhattathiripad', email: 'neeraj@intellicar.in', avatarUrl: null },
  prudhviraj: { id: 'usr_01J8Z002000000000000000007', name: 'Prudhviraj P', email: 'prudhviraj@intellicar.in', avatarUrl: null },
  abhinay:    { id: 'usr_01J8Z003000000000000000006', name: 'Abhinay Kumar', email: 'abhinay@intellicar.in', avatarUrl: null },
  kavya:      { id: 'usr_01J8Z004000000000000000005', name: 'Kavya V', email: 'kavya@intellicar.in', avatarUrl: null },
  alwin:      { id: 'usr_01J8Z005000000000000000000', name: 'Alwin Thomas', email: 'alwin@intellicar.in', avatarUrl: null },
  abhishek:   { id: 'usr_01J8Z006000000000000000008', name: 'Abhishek Kumar', email: 'abhishek@intellicar.in', avatarUrl: null },
  anantha:    { id: 'usr_01J8Z007000000000000000000', name: 'Anantha Krishnan T G', email: 'anantha@intellicar.in', avatarUrl: '/mock-avatars/anantha.png' },
  aswin:      { id: 'usr_01J8Z008000000000000000008', name: 'ASWIN', email: 'aswin@intellicar.in', avatarUrl: null },
  shibin:     { id: 'usr_01J8Z009000000000000000008', name: 'SHIBIN GP', email: 'shibin@intellicar.in', avatarUrl: null },
  gouru:      { id: 'usr_01J8Z00A000000000000000005', name: 'Gouru Tejomai Tejomai', email: 'gouru@intellicar.in', avatarUrl: null },
  devanand:   { id: 'usr_01J8Z00B000000000000000006', name: 'Devanand P', email: 'devanand@intellicar.in', avatarUrl: null },
  guttula:    { id: 'usr_01J8Z00C000000000000000000', name: 'Guttula Sai', email: 'guttula@intellicar.in', avatarUrl: '/mock-avatars/guttula.png' },
  pradeep:    { id: 'usr_01J8Z00D000000000000000000', name: 'Pradeep Chandran', email: 'pradeep@intellicar.in', avatarUrl: '/mock-avatars/pradeep.png' },
  bommidi:    { id: 'usr_01J8Z00E000000000000000006', name: 'Bommidi Satya Durga prasad', email: 'bommidi@intellicar.in', avatarUrl: null },
  rohit:      { id: 'usr_01J8Z00F000000000000000001', name: 'Rohit Srivastava', email: 'rohitsrivastava@intellicar.in', avatarUrl: null },
};

/** The user that POST /auth/mock-login signs in as. */
export const MOCK_LOGIN_USER_KEY = 'rohit';

export const DMT_WORKSPACE_ID = 'wsp_01J8Z000000000000000000001';

export const WORKSPACES = [
  { id: DMT_WORKSPACE_ID, name: 'DMT', createdAt: '2026-01-05T04:30:00Z' },
];

/** Members of DMT, in join order (OWNER first — settings_light.png). The last two are below the fold. */
export const DMT_MEMBERS = [
  'neeraj', 'prudhviraj', 'abhinay', 'kavya', 'alwin', 'abhishek', 'anantha', 'aswin',
  'shibin', 'gouru', 'devanand', 'guttula', 'pradeep', 'bommidi', 'rohit',
].map((key, index) => ({
  userKey: key,
  role: index === 0 ? 'OWNER' : 'MEMBER',
  joinedAt: new Date(Date.UTC(2026, 0, 5 + index, 4, 30)).toISOString(),
}));

/** Invite codes accepted by POST /workspaces/join. */
export const INVITES = {
  'DEMO-123': { workspace: { id: 'wsp_01J8Z000000000000000000002', name: 'Demo Team', createdAt: '2026-03-01T04:30:00Z' }, ownerKey: 'neeraj' },
};
