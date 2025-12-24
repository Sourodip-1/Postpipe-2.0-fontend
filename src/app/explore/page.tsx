import { ExplorePageContent } from "@/components/explore/ExplorePageContent"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Explore',
}

export default function Page() {
    return <ExplorePageContent />
}
