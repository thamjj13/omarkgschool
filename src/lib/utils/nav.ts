export interface FlatNavItem {
  id: number;
  parent_id: number | null;
  label: string;
  url: string;
  type: string;
  target: string;
  location: string;
  display_order: number;
  status: string;
}

export interface NavNode {
  label: string;
  url: string;
  target: string;
  external: boolean;
  children: NavNode[];
}

/** Build a nested navigation tree from flat rows. */
export function buildNavTree(items: FlatNavItem[]): NavNode[] {
  const roots = items
    .filter((i) => !i.parent_id)
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
  const childrenByParent = new Map<number, FlatNavItem[]>();
  for (const item of items) {
    if (!item.parent_id) continue;
    const list = childrenByParent.get(item.parent_id) ?? [];
    list.push(item);
    childrenByParent.set(item.parent_id, list);
  }

  const toNode = (item: FlatNavItem): NavNode => {
    const kids = (childrenByParent.get(item.id) ?? [])
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .map(toNode);
    return {
      label: item.label,
      url: item.url,
      target: item.target,
      external: item.type === "external",
      children: kids,
    };
  };

  return roots.map(toNode);
}
