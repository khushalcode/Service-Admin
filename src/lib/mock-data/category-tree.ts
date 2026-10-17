export interface CategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  image: string;
  providerCount: number;
  serviceCount?: number;
  children?: CategoryTreeNode[];
}

const CATEGORY_NAMES = [
  "Home Service",
  "Cleaning Service",
  "Repair & Maintenance",
  "Beauty & Spa",
  "Health & Wellness",
"Home Service",
  "Cleaning Service",
  "Repair & Maintenance",
  "Beauty & Spa",
  "Health & Wellness",
  "Home Service",
  "Cleaning Service",
  "Repair & Maintenance",
  "Beauty & Spa",
  "Health & Wellness",
];

const SUB_CATEGORY_NAMES = [
  "Carpet Cleaning",
  "Deep Cleaning",
   "Carpet Cleaning",
  "Deep Cleaning", "Carpet Cleaning",
  "Deep Cleaning", "Carpet Cleaning",
  "Deep Cleaning", "Carpet Cleaning",
  "Deep Cleaning", "Carpet Cleaning",
  "Deep Cleaning", "Carpet Cleaning",
  "Deep Cleaning",
];

const LEAF_CATEGORY_NAMES = [
  "Standard Package",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildLeaves(categoryIndex: number, subIndex: number): CategoryTreeNode[] {
  return LEAF_CATEGORY_NAMES.map((name, leafIndex) => {
    const id = `category-${categoryIndex + 1}-sub-${subIndex + 1}-leaf-${leafIndex + 1}`;
    return {
      id,
      slug: slugify(`${name}-${id}`),
      name,
      image: "https://placehold.co/250x332",
      providerCount: 3 + ((leafIndex + subIndex + categoryIndex) % 5),
    };
  });
}

function buildSubCategories(categoryIndex: number): CategoryTreeNode[] {
  return SUB_CATEGORY_NAMES.map((name, subIndex) => {
    const id = `category-${categoryIndex + 1}-sub-${subIndex + 1}`;
    return {
      id,
      slug: slugify(`${name}-${id}`),
      name,
      image: "https://placehold.co/250x332",
      providerCount: 3 + ((subIndex + categoryIndex) % 5),
      children: buildLeaves(categoryIndex, subIndex),
    };
  });
}

export const categoryTree: CategoryTreeNode[] = CATEGORY_NAMES.map((name, categoryIndex) => {
  const id = `category-${categoryIndex + 1}`;
  return {
    id,
    slug: slugify(`${name}-${id}`),
    name,
    image: "https://placehold.co/250x332",
    providerCount: 20 + categoryIndex,
    children: buildSubCategories(categoryIndex),
  };
});

export function findCategoryNode(path: string[]): CategoryTreeNode | undefined {
  let nodes = categoryTree;
  let node: CategoryTreeNode | undefined;

  for (const id of path) {
    node = nodes.find((item) => item.id === id);
    if (!node) return undefined;
    nodes = node.children ?? [];
  }

  return node;
}
