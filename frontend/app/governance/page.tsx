import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { GovernanceContent } from "@/components/governance-content"

export default function GovernancePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <GovernanceContent />
        </main>
      </div>
    </div>
  )
}
