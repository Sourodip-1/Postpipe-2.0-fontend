
"use server"

import dbConnect from "@/lib/auth/mongodb";
import Template from "@/lib/models/Template";

export async function getTemplates(searchQuery?: string) {
  await dbConnect();
  try {
    const query: any = { isPublished: true };
    
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      query.$or = [
        { name: regex },
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
