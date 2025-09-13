"use client"
import { QueryBuilderInterface } from "@/components/query-builder/query-builder-interface"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default function QueryBuilderPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <QueryBuilderInterface />
        </main>
      </div>
    </div>
  )
}


