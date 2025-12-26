"use client"

import * as React from "react"
import {
    BookOpen,
    Box,
    CheckCircle2,
    LayoutTemplate,
    Lock,
    Search,
    Settings2,
    Sparkles,
    Tag,
    Layers
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { getExploreFilters } from "@/lib/actions/explore"
import { SearchPopup } from "./SearchPopup"

type CategoryItem = {
    title: string
    url: string
    icon: React.ElementType
    badge?: string
}

type CategoryGroup = {
    title: string
    items: CategoryItem[]
}


export function ExploreSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [searchOpen, setSearchOpen] = React.useState(false)
    const [dynamicGroups, setDynamicGroups] = React.useState<CategoryGroup[]>([])

    React.useEffect(() => {
        const fetchFilters = async () => {
            const data = await getExploreFilters();

            const categoryGroup: CategoryGroup = {
                title: "Categories",
                items: data.categories.map(cat => ({
                    title: cat,
                    url: `?category=${encodeURIComponent(cat)}`,
                    icon: Layers // Default icon
                }))
            };

            const tagGroup: CategoryGroup = {
                title: "Tags",
                items: data.tags.map(tag => ({
                    title: tag,
                    url: `?tag=${encodeURIComponent(tag)}`,
                    icon: Tag // Default icon
                }))
            };

            // If no categories found, use defaults or empty
            if (categoryGroup.items.length === 0) {
                // Fallback or keep static if desired
            }

            setDynamicGroups([categoryGroup, tagGroup]);
        };

        fetchFilters();
    }, []);

    // Use static categories initially or as fallback? 
    // The user requested dynamic connectivity. 
    // I'll render what I have. If empty, it will verify that DB is empty.

    // Combining static "Components" only if fetched data is empty might be confusing.
    // I'll just render dynamic ones + static discover.

    return (
        <>
            <Sidebar {...props} className="pt-16">
                <SidebarContent>
                    {dynamicGroups.length > 0 ? (
                        dynamicGroups.map((group) => (
                            <SidebarGroup key={group.title}>
                                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton asChild>
                                                    <a href={item.url}>
                                                        <item.icon />
                                                        <span>{item.title}</span>
                                                        {item.badge && (
                                                            <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </a>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground">Loading filters...</div>
                    )}
                </SidebarContent>
                <SidebarRail />
            </Sidebar>
            <SearchPopup open={searchOpen} setOpen={setSearchOpen} />
        </>
    )
}
