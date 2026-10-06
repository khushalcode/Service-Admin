import type { CategoryTreeNode } from "@/lib/mock-data/category-tree";

// get_categories_hierarchical names the display field `category_name` at the
// top level but `name` on nested children — both are covered here.
export interface CategoryHierarchicalApi {
  id: string;
  slug: string;
  category_name?: string;
  name?: string;
  translated_name: string;
  image: string;
  sort_order: string;
  children: CategoryHierarchicalApi[] | null;
}

export interface CategoriesHierarchicalResponse {
  error: boolean;
  message: string;
  data: CategoryHierarchicalApi[];
  code: number;
}

export function toCategoryTreeNode(node: CategoryHierarchicalApi): CategoryTreeNode {
  return {
    id: node.id,
    slug: node.slug,
    name: node.translated_name || node.category_name || node.name || "",
    image: node.image,
    providerCount: 0,
    children: node.children?.map(toCategoryTreeNode),
  };
}
