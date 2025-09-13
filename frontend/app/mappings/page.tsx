"use client"
import { MappingRulesList } from "@/components/mapping-rules/mapping-rules-list"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default function MappingsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <MappingRulesList />
        </main>
      </div>
    </div>
  )
}
