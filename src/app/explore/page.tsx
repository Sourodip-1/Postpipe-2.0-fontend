import { ExplorePageContent } from "@/components/explore/ExplorePageContent"
import { getTemplates } from "@/lib/actions/explore"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Explore',
}

type Props = {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: Props) {
    const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const tag = typeof searchParams.tag === 'string' ? searchParams.tag : undefined;
    const templates = await getTemplates(q, category, tag);
    return <ExplorePageContent templates={templates} />
}
