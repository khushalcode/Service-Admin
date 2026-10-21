// Real photographic category icons, served from
// /public/category-icons/*.png. Matched by keywords in the category name/slug
// so they work no matter what image the admin panel has uploaded. To use a
// new icon: drop a PNG in public/category-icons and add a keyword row below.
const ICON_RULES: Array<[RegExp, string]> = [
  [/pest|termite|bug|rodent|fumigat/i, "pest-control"],
  [/plumb|pipe|tap|leak|bath/i, "plumbing"],
  [/\bac\b|air.?cond|hvac|cooling/i, "ac"],
  [/laundry|wash|dry.?clean|iron/i, "laundry"],
  [/salon|beauty|spa|hair|makeup|massage/i, "salon"],
  [/carpent|wood|furniture/i, "carpenter"],
  [/electrician|wiring|electrical/i, "electrician"],
  [/electronic|appliance|tv|gadget|repair/i, "electronic"],
  [/mechanic|car\b|auto|vehicle|bike/i, "mechanic"],
  [/pet|dog|cat|vet/i, "pet-care"],
  [/paint/i, "painting"],
  [/clean|maid|sanit|disinfect/i, "cleaning"],
  [/home|house/i, "home"],
];

export function getCategoryIcon(category: { name?: string; slug?: string }): string {
  const haystack = `${category.name ?? ""} ${category.slug ?? ""}`;
  for (const [pattern, icon] of ICON_RULES) {
    if (pattern.test(haystack)) return `/category-icons/${icon}.png`;
  }
  return "/category-icons/default.png";
}
