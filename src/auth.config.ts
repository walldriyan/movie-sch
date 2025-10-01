// This file is now redundant. All auth configuration is now in src/auth.ts
// We are keeping this file to avoid breaking imports in other files that might still reference it.
// A future cleanup task would be to remove this file and update all imports to point to src/auth.ts

import { auth, authConfig } from "./auth";

export { auth, authConfig };
