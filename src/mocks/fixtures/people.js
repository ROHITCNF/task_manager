/**
 * Mock server data in the API wire format (docs/lld/api/openapi.yaml).
 * Reproduces the reference screenshots (settings_light.png, home_light.png, taskboard_light.png).
 *
 * User ids were chosen so the UI's avatar colour hash (src/domain/avatar.js) lands on the colour
 * seen in the reference for each initial-letter avatar.
 */

export const USERS = {
  neeraj:     { id: 'usr_01J8Z00100000000000000000J', name: 'Neeraj Bhattathiripad', email: 'neeraj@intellicar.in', avatarUrl: null },
  prudhviraj: { id: 'usr_01J8Z00200000000000000000H', name: 'Prudhviraj P', email: 'prudhviraj@intellicar.in', avatarUrl: null },
  abhinay:    { id: 'usr_01J8Z003000000000000000008', name: 'Abhinay Kumar', email: 'abhinay@intellicar.in', avatarUrl: null },
  kavya:      { id: 'usr_01J8Z004000000000000000006', name: 'Kavya V', email: 'kavya@intellicar.in', avatarUrl: null },
  alwin:      { id: 'usr_01J8Z005000000000000000000', name: 'Alwin Thomas', email: 'alwin@intellicar.in', avatarUrl: null },
  abhishek:   { id: 'usr_01J8Z00600000000000000000J', name: 'Abhishek Kumar', email: 'abhishek@intellicar.in', avatarUrl: null },
  anantha:    { id: 'usr_01J8Z007000000000000000000', name: 'Anantha Krishnan T G', email: 'anantha@intellicar.in', avatarUrl: '/mock-avatars/anantha.png' },
  aswin:      { id: 'usr_01J8Z008000000000000000001', name: 'ASWIN', email: 'aswin@intellicar.in', avatarUrl: null },
  shibin:     { id: 'usr_01J8Z009000000000000000000', name: 'SHIBIN GP', email: 'shibin@intellicar.in', avatarUrl: null },
  gouru:      { id: 'usr_01J8Z00A000000000000000004', name: 'Gouru Tejomai Tejomai', email: 'gouru@intellicar.in', avatarUrl: null },
  devanand:   { id: 'usr_01J8Z00B000000000000000004', name: 'Devanand P', email: 'devanand@intellicar.in', avatarUrl: null },
  guttula:    { id: 'usr_01J8Z00C000000000000000000', name: 'Guttula Sai', email: 'guttula@intellicar.in', avatarUrl: '/mock-avatars/guttula.png' },
  pradeep:    { id: 'usr_01J8Z00D000000000000000000', name: 'Pradeep Chandran', email: 'pradeep@intellicar.in', avatarUrl: '/mock-avatars/pradeep.png' },
  bommidi:    { id: 'usr_01J8Z00E000000000000000006', name: 'Bommidi Satya Durga prasad', email: 'bommidi@intellicar.in', avatarUrl: null },
  rohit:      { id: 'usr_01J8Z00F000000000000000006', name: 'Rohit Srivastava', email: 'rohitsrivastava@intellicar.in', avatarUrl: null },
  anusha:     { id: 'usr_01J8Z00G000000000000000001', name: 'Anusha P', email: 'anusha@intellicar.in', avatarUrl: null },
  karan:      { id: 'usr_01J8Z00H000000000000000000', name: 'Karan Aneja', email: 'karan@intellicar.in', avatarUrl: '/mock-avatars/karan.png' },
  saksham:    { id: 'usr_01J8Z00J000000000000000000', name: 'Saksham Tulani', email: 'saksham@intellicar.in', avatarUrl: '/mock-avatars/saksham.png' },
  joseph:     { id: 'usr_01J8Z00K00000000000000000H', name: 'Joseph MJ', email: 'joseph@intellicar.in', avatarUrl: null },
  bikky:      { id: 'usr_01J8Z00M000000000000000000', name: 'Bikky K S', email: 'bikky@intellicar.in', avatarUrl: '/mock-avatars/bikky.png' },
  balapriya:  { id: 'usr_01J8Z00N00000000000000000K', name: 'Balapriya Priya', email: 'balapriya@intellicar.in', avatarUrl: null },
  ayush:      { id: 'usr_01J8Z00P000000000000000003', name: 'Ayush Mhaskar', email: 'ayush@intellicar.in', avatarUrl: null },
  kriti:      { id: 'usr_01J8Z00Q000000000000000004', name: 'Kriti Anand', email: 'kriti@intellicar.in', avatarUrl: null },
  debnath:    { id: 'usr_01J8Z00R00000000000000000J', name: 'Debnath Mondal', email: 'debnath@intellicar.in', avatarUrl: null },
};

/** The user that POST /auth/mock-login signs in as. */
export const MOCK_LOGIN_USER_KEY = 'rohit';

export const DMT_WORKSPACE_ID = 'wsp_01J8Z000000000000000000001';

export const WORKSPACES = [
  { id: DMT_WORKSPACE_ID, name: 'DMT', createdAt: '2026-01-05T04:30:00Z' },
];

/**
 * Members of DMT, in join order (OWNER first). Order follows settings_light.png, then the member chips of
 * card_click_state_light.png for the members below the Settings fold.
 */
export const DMT_MEMBERS = [
  'neeraj', 'prudhviraj', 'abhinay', 'kavya', 'alwin', 'abhishek', 'anantha', 'aswin',
  'shibin', 'gouru', 'devanand', 'guttula', 'pradeep', 'bommidi', 'anusha', 'karan',
  'saksham', 'joseph', 'rohit', 'bikky', 'balapriya', 'ayush', 'kriti', 'debnath',
].map((key, index) => ({
  userKey: key,
  role: index === 0 ? 'OWNER' : 'MEMBER',
  joinedAt: new Date(Date.UTC(2026, 0, 5 + index, 4, 30)).toISOString(),
}));

/** Invite codes accepted by POST /workspaces/join. */
export const INVITES = {
  'DEMO-123': { workspace: { id: 'wsp_01J8Z000000000000000000002', name: 'Demo Team', createdAt: '2026-03-01T04:30:00Z' }, ownerKey: 'neeraj' },
};
