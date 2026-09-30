/**
 * Clients of the DMT workspace (clients_light.png; colours sampled from the screenshots).
 * The last four are below the fold in the reference but appear as pills on task cards.
 * taskCount is computed by the mock server from task links; the target counts are in tasks.js.
 */
const client = (n, name, colour) => ({
  key: name,
  id: `cli_01J8Z${String(n).padStart(3, '0')}000000000000000000`,
  name,
  colour,
  docCount: 0,
  version: 1,
  createdAt: '2026-02-01T04:30:00Z',
});

export const CLIENTS = [
  client(1, 'Aeidith', '#4ca154'),
  client(2, 'Akasa', '#ca3b76'),
  client(3, 'All Clients', '#cc7c2e'),
  client(4, 'Alva Auto', '#4ca154'),
  client(5, 'Amararaja', '#418faf'),
  client(6, 'Anantshree Vehicle Pvt. Ltd.', '#4e46dd'),
  client(7, 'BGauss', '#d9622b'),
  client(8, 'Battery Smart', '#ca3a32'),
  client(9, 'Bounce', '#ca3a32'),
  client(10, 'EVM Wheels', '#743ee4'),
  client(11, 'Eastman', '#4e46dd'),
  client(12, 'Epitome', '#418faf'),
  client(13, 'Exicom', '#3762e3'),
  client(14, 'HWY Rider', '#73a233'),
  client(15, 'Hero Motocorp', '#4ca154'),
  client(16, 'Jupiter Electric Mobility', '#73a233'),
  client(17, 'Jupiter Wagon Limited', '#73a233'),
  client(18, 'Mr. Med', '#ca3b76'),
  client(19, 'Multiple Clients', '#743ee4'),
  client(20, 'Tata Motors', '#ca3b76'),
  client(21, 'Tum Tum', '#ca3b76'),
];

export const LABELS = [];

/** Docs of the DMT workspace (docs_light.png), most recently updated first. None are linked to a client. */
export const DOCS = [
  'Untitled', 'Untitled', 'Untitled', 'Untitled', 'Untitled', 'image (1)', 'Untitled', 'Test1', 'test5',
].map((title, i) => ({
  id: `doc_01J8Z${String(i + 1).padStart(3, '0')}000000000000000000`,
  title,
  clientId: null,
  updatedAt: new Date(Date.UTC(2026, 8, 29, 12 - i, 0)).toISOString(),
}));
