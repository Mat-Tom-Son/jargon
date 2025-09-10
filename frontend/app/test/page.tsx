import { QueryTestingInterface } from "@/components/query-testing/query-testing-interface"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default function TestPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <QueryTestingInterface />
        </main>
      </div>
    </div>
  )
}
