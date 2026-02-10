// Apple Health workout activity type mappings and XML helpers

export interface ActivityMapping {
  exercise_key: string;
  exercise_subtype: string | null;
  description: string;
}

/** Maps HKWorkoutActivityType values to our exercise schema */
export const ACTIVITY_MAP: Record<string, ActivityMapping> = {
  HKWorkoutActivityTypeWalking: { exercise_key: "walk_run", exercise_subtype: "walking", description: "Walking" },
  HKWorkoutActivityTypeRunning: { exercise_key: "walk_run", exercise_subtype: "running", description: "Running" },
  HKWorkoutActivityTypeHiking: { exercise_key: "walk_run", exercise_subtype: "hiking", description: "Hiking" },
  HKWorkoutActivityTypeCycling: { exercise_key: "cycling", exercise_subtype: "outdoor", description: "Cycling" },
  HKWorkoutActivityTypeStationaryCycling: { exercise_key: "cycling", exercise_subtype: "indoor", description: "Indoor Cycling" },
  HKWorkoutActivityTypeSwimming: { exercise_key: "swimming", exercise_subtype: "pool", description: "Swimming" },
  HKWorkoutActivityTypeElliptical: { exercise_key: "elliptical", exercise_subtype: null, description: "Elliptical" },
  HKWorkoutActivityTypeRowing: { exercise_key: "rowing", exercise_subtype: null, description: "Rowing" },
  HKWorkoutActivityTypeStairClimbing: { exercise_key: "stair_climber", exercise_subtype: null, description: "Stair Climbing" },
  HKWorkoutActivityTypeJumpRope: { exercise_key: "jump_rope", exercise_subtype: null, description: "Jump Rope" },
};

export const MAPPED_TYPES = new Set(Object.keys(ACTIVITY_MAP));

export const APPLE_HEALTH_RAW_INPUT = "apple-health-import";

/** Extract an XML attribute value from a string */
export function extractAttribute(xml: string, attr: string): string | null {
  const regex = new RegExp(`${attr}=\\"([^\\"]*)\\"`, "i");
  const match = xml.match(regex);
  return match?.[1] ?? null;
}

/** Parse the startDate attribute into a Date object */
export function parseStartDate(xml: string): Date | null {
  const val = extractAttribute(xml, "startDate");
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/** Extract duration in minutes from the duration attribute */
export function parseDuration(xml: string): number | null {
  const val = extractAttribute(xml, "duration");
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

/** Extract totalDistance from child elements (in km), convert to miles */
export function parseTotalDistanceMiles(xml: string): number | null {
  // Look for <WorkoutStatistics type="HKQuantityTypeIdentifierDistanceWalkingRunning" ... sum="X.XX" />
  // or <WorkoutStatistics type="HKQuantityTypeIdentifierDistanceCycling" ... sum="X.XX" />
  const distanceRegex = /type="HKQuantityTypeIdentifier(?:DistanceWalkingRunning|DistanceCycling|DistanceSwimming)"[^>]*?sum="([^"]+)"/i;
  const match = xml.match(distanceRegex);
  if (!match) return null;
  const km = parseFloat(match[1]);
  if (isNaN(km)) return null;
  return Math.round(km * 0.621371 * 100) / 100;
}

/** Extract totalEnergyBurned from child elements */
export function parseTotalCalories(xml: string): number | null {
  const calRegex = /type="HKQuantityTypeIdentifierActiveEnergyBurned"[^>]*?sum="([^"]+)"/i;
  const match = xml.match(calRegex);
  if (!match) return null;
  const cal = parseFloat(match[1]);
  return isNaN(cal) ? null : Math.round(cal);
}

/** Format a date as YYYY-MM-DD for logged_date */
export function toLoggedDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Short type name for display (strip HKWorkoutActivityType prefix) */
export function shortTypeName(activityType: string): string {
  return activityType.replace("HKWorkoutActivityType", "");
}

export interface ParsedWorkout {
  activityType: string;
  startDate: Date;
  loggedDate: string;
  durationMinutes: number | null;
  distanceMiles: number | null;
  caloriesBurned: number | null;
  mapping: ActivityMapping;
}

/** Parse a complete <Workout> XML block into a structured object, or null if unmapped/invalid */
export function parseWorkoutBlock(xml: string): ParsedWorkout | null {
  const activityType = extractAttribute(xml, "workoutActivityType");
  if (!activityType || !ACTIVITY_MAP[activityType]) return null;

  const startDate = parseStartDate(xml);
  if (!startDate) return null;

  return {
    activityType,
    startDate,
    loggedDate: toLoggedDate(startDate),
    durationMinutes: parseDuration(xml),
    distanceMiles: parseTotalDistanceMiles(xml),
    caloriesBurned: parseTotalCalories(xml),
    mapping: ACTIVITY_MAP[activityType],
  };
}
