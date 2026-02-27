
"use server"

import dbConnect from "@/lib/auth/mongodb";
import Template from "@/lib/models/Template";

export async function getTemplates(searchQuery?: string, category?: string, tag?: string) {
  await dbConnect();
  try {
    const query: any = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      query.$or = [
        { name: regex },
        // { category: regex }, // Don't search category if explicitly filtering? 
        // Actually it's fine to keep it, but if user filters by category "Auth" and searches "Nav", we want "Nav" items in "Auth" category.
        // If we keep searching category field with regex, searching "Auth" while filter is "Auth" is redundant but harmless.
        { category: regex },
        { tags: regex }
      ];
    }

    const templates = await Template.find(query).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(templates));
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export async function getExploreFilters() {
  await dbConnect();
  try {
    const templates = await Template.find({ isPublished: true }).select('category tags').lean();

    const categories = new Set<string>();
    const tags = new Set<string>();

    templates.forEach((t: any) => {
      if (t.category) categories.add(t.category);
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag: string) => tags.add(tag));
      }
    });

    return {
      categories: Array.from(categories),
      tags: Array.from(tags)
    };
  } catch (error) {
    console.error("Error fetching filters:", error);
    return { categories: [], tags: [] };
  }
}
