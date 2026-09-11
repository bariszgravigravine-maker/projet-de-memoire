import { DashboardShell } from "@/components/dashboard-shell"
import { SearchView } from "@/components/search-view"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
