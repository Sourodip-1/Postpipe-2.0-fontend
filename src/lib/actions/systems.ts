"use server"

import { getSession } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { createSystem as createSystemDB, getSystems as getSystemsDB } from "@/lib/server-db";
import dbConnect from "@/lib/auth/mongodb";
import Template from "@/lib/models/Template";

export async function createSystem(name: string, type: string, templateId?: string) {
    const session = await getSession();
    if (!session?.userId) {
        return { success: false, message: "Please log in to add systems." };
    }

    try {
        await createSystemDB(name, type, templateId, session.userId);
        revalidatePath('/dashboard/systems');
        return { success: true, message: "System added to dashboard." };
    } catch (error) {
        console.error("Error creating system:", error);
        return { success: false, message: "Failed to create system." };
    }
}

export async function getSystems() {
    const session = await getSession();
    if (!session?.userId) return [];

    try {
        const systems = await getSystemsDB(session.userId);
        
        // Enrich with template data
        let templateMap = new Map();
        try {
            await dbConnect();
            const templateIds = systems.map((s: any) => s.templateId).filter(Boolean);
            
            if (templateIds.length > 0) {
                const templates = await Template.find({ _id: { $in: templateIds } }).lean();
                templateMap = new Map(templates.map((t: any) => [t._id.toString(), t]));
            }
        } catch (enrichError) {
             console.error("Failed to enrich systems with templates:", enrichError);
             // Continue without enrichment
        }

        return systems.map((sys: any) => {
            const template: any = sys.templateId ? templateMap.get(sys.templateId) : null;
            
            return {
                id: sys.id,
                name: sys.name,
                type: sys.type,
                database: template?.databaseConfigurations?.[0]?.databaseName || 'MongoDB', 
                status: 'Active',
                environment: 'Dev',
                lastUsed: new Date(sys.createdAt).toLocaleDateString(),
                isFavorite: false,
                image: template?.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60", 
                author: { 
                    name: template?.author?.name || 'PostPipe',
                    profileUrl: template?.author?.profileUrl 
                },
                tags: template?.tags || [],
                cli: template?.cli,
                aiPrompt: template?.aiPrompt,
                npmPackageUrl: template?.npmPackageUrl
            };
        });
    } catch (error) {
        console.error("Error fetching systems:", error);
        return [];
    }
}

export async function toggleFavoriteSystem(systemId: string) {
    // Not implemented in new schema yet
    return { success: true };
}
