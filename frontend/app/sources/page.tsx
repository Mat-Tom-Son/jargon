"use client"

import { DataSourcesList } from "@/components/data-sources/data-sources-list"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export const dynamic = 'force-dynamic'

export default function SourcesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <DataSourcesList />
        </main>
      </div>
    </div>
  )
}
