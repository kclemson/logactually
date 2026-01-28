/**
 * Feature flags for gating new functionality.
 * 
 * Set to `true` to enable for all users.
 * Use `import.meta.env.DEV` to enable only in development.
 */
export const FEATURES = {
  /** Weight training logging and trends */
  WEIGHT_TRACKING: import.meta.env.DEV,
} as const;
