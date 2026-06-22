// Activities — the second discovery axis (see instructions/01_data_model.md §3a).
//
// Categories organize gear by WHAT IT IS; activities organize operators by WHAT YOU DO.
// Activities deliberately cut across gear categories so a seasonal browse page (e.g. the
// Winter landing page) can show one set of tabs that pull operators from several categories
// at once. They are stored on operators.activities (a tag array) — NOT on equipment — so gear
// keeps its single natural `category` while the activity tag is the cross-cutting lens.
//
// This file is the source of truth for: the browse-page tabs, the activity->gear mapping the
// page queries with, and the Google Places search terms used to discover operators.
//
// CRAWL SCOPE (v1): the full taxonomy + search terms are defined now for eventual national
// expansion, but `crawlEnabled` gates which activities are actually crawled by Places. For v1
// the crawl is also region-limited to the 50-mile Reno radius (see lib/config/geo.ts and
// instructions/02_database_seeding.md §6). Defining inactive activities is cheap config;
// crawling them nationally is out of v1 scope and a real API cost.

export type Season = "winter" | "summer" | "all";

export interface Activity {
  /** Stable slug stored in operators.activities[] */
  slug: string;
  /** Tab label shown on the browse page */
  label: string;
  season: Season;
  /** Gear categories (lib/config/categories.ts) this activity pulls operators/equipment from */
  categories: string[];
  /** Optional narrowing to specific subcategory slugs within those categories */
  subcategories?: string[];
  /** Google Places text-search queries used to discover operators for this activity */
  placesSearchTerms: string[];
  /** Whether the Places crawl currently runs for this activity (v1: all winter, Tahoe-scoped) */
  crawlEnabled: boolean;
}

export const ACTIVITIES: Activity[] = [
  {
    slug: "ski_snowboard",
    label: "Ski/Snowboard",
    season: "winter",
    categories: ["snow_sports"],
    subcategories: [
      "alpine_ski",
      "backcountry_ski",
      "telemark_ski",
      "cross_country_ski",
      "snowboard",
      "splitboard",
      "apparel_snow",
      "avalanche_safety",
    ],
    placesSearchTerms: [
      "ski rental",
      "ski demo",
      "snowboard rental",
      "snowboard demo",
      "nordic ski rental",
      "cross country ski rental",
      "backcountry ski rental",
      "ski shop",
    ],
    crawlEnabled: true,
  },
  {
    slug: "snowshoe",
    label: "Snowshoe",
    season: "winter",
    categories: ["snow_sports"],
    subcategories: ["snowshoe"],
    placesSearchTerms: ["snowshoe rental"],
    crawlEnabled: true,
  },
  {
    slug: "sled",
    label: "Sled",
    season: "winter",
    categories: ["snow_sports"],
    subcategories: ["sled"],
    placesSearchTerms: ["sled rental", "snow tube rental", "tubing rental"],
    crawlEnabled: true,
  },
  {
    slug: "snowmobile",
    label: "Snowmobile/Timbersled",
    season: "winter",
    // Snowmobiles/timbersleds live in snow_sports (off_road is summer powersports).
    categories: ["snow_sports"],
    subcategories: ["snowmobile", "timbersled"],
    placesSearchTerms: [
      "snowmobile rental",
      "snowmobile tours",
      "timbersled rental",
    ],
    crawlEnabled: true,
  },
  {
    slug: "fat_bike",
    label: "Fat Bike",
    season: "winter",
    // Fat-tire "snow bikes" (human-powered or e-assist) belong here, NOT timbersled.
    categories: ["mountain_biking"],
    subcategories: ["fat_bike"],
    placesSearchTerms: ["fat bike rental", "fat tire bike rental", "snow bike rental"],
    crawlEnabled: true,
  },
  {
    slug: "snow_camp",
    label: "Snow Camp",
    season: "winter",
    categories: ["camping"],
    // Winter / 4-season use of standard camping gear — no dedicated subcategory.
    placesSearchTerms: ["winter camping gear rental", "4 season tent rental", "backcountry gear rental"],
    crawlEnabled: true,
  },
  {
    slug: "ice_skate",
    label: "Ice Skate",
    season: "winter",
    // ice_skates moved into snow_sports (winter_other category retired).
    categories: ["snow_sports"],
    subcategories: ["ice_skates"],
    placesSearchTerms: ["ice skate rental", "ice rink skate rental"],
    crawlEnabled: true,
  },
  {
    slug: "winter_mountaineering",
    label: "Winter Mountaineering",
    season: "winter",
    // Now maps to the dedicated mountaineering category, plus the snow_sports
    // backcountry crossover for ski-mountaineering (gear_types ice_axe / crampons /
    // ski_crampons). See instructions/extraction/mountaineering.md & snow_sports.md.
    categories: ["mountaineering", "snow_sports"],
    subcategories: ["ice_axe", "crampons", "rope_hardware", "full_kit", "backcountry_ski"],
    placesSearchTerms: [
      "mountaineering gear rental",
      "ice climbing gear rental",
      "ski mountaineering rental",
    ],
    crawlEnabled: true,
  },
] as const;

/** All activity slugs (handy for validating operators.activities[] on write). */
export const ACTIVITY_SLUGS = ACTIVITIES.map((a) => a.slug);

/** Activities to render as winter browse-page tabs, in order. */
export const WINTER_ACTIVITIES = ACTIVITIES.filter((a) => a.season === "winter");
