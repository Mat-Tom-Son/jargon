"use client"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SemanticDebtContent } from "@/components/semantic-debt-content"

export default function SemanticDebtPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <SemanticDebtContent />
        </main>
      </div>
    </div>
  )
}
