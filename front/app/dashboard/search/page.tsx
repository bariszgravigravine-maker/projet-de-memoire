import { Suspense } from "react"
import { SearchView } from "@/components/search-view"

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-stone-100" />}>
      <SearchView />
    </Suspense>
  )
}
