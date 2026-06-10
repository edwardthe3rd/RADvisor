// Curated regional spots for the questionnaire location step
// (instructions/04 §3 Step 3). Coordinates sort operators by proximity;
// they never hard-filter.
export interface RegionSpot {
  slug: string;
  label: string;
  lat: number;
  lng: number;
}

export const REGION_SPOTS: RegionSpot[] = [
  { slug: "reno", label: "Reno", lat: 39.5296, lng: -119.8138 },
  { slug: "north-lake-tahoe", label: "North Lake Tahoe", lat: 39.2378, lng: -120.0437 },
  { slug: "south-lake-tahoe", label: "South Lake Tahoe", lat: 38.9399, lng: -119.9772 },
  { slug: "truckee", label: "Truckee", lat: 39.328, lng: -120.1833 },
  { slug: "mt-rose", label: "Mt. Rose", lat: 39.3286, lng: -119.8843 },
  { slug: "northstar", label: "Northstar", lat: 39.2746, lng: -120.1211 },
  { slug: "palisades", label: "Palisades Tahoe", lat: 39.1969, lng: -120.2356 },
  { slug: "pyramid-lake", label: "Pyramid Lake", lat: 39.9907, lng: -119.5859 },
  { slug: "carson-river", label: "Carson River", lat: 39.1638, lng: -119.7674 },
  { slug: "donner", label: "Donner Lake", lat: 39.3247, lng: -120.2655 },
  { slug: "carson-city", label: "Carson City", lat: 39.1638, lng: -119.7674 },
  { slug: "sparks", label: "Sparks", lat: 39.5349, lng: -119.7527 },
];
