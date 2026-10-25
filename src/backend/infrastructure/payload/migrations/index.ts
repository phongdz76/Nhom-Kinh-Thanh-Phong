import * as migration_20261022_060533_backend from './20261022_060533_backend';
import * as migration_20261024_091346_zalo_qr from './20261024_091346_zalo_qr';
import * as migration_20261024_094304_estimates from './20261024_094304_estimates';
import * as migration_20261025_031442_map_location from './20261025_031442_map_location';

export const migrations = [
  {
    up: migration_20261022_060533_backend.up,
    down: migration_20261022_060533_backend.down,
    name: '20261022_060533_backend',
  },
  {
    up: migration_20261024_091346_zalo_qr.up,
    down: migration_20261024_091346_zalo_qr.down,
    name: '20261024_091346_zalo_qr',
  },
  {
    up: migration_20261024_094304_estimates.up,
    down: migration_20261024_094304_estimates.down,
    name: '20261024_094304_estimates',
  },
  {
    up: migration_20261025_031442_map_location.up,
    down: migration_20261025_031442_map_location.down,
    name: '20261025_031442_map_location'
  },
];
