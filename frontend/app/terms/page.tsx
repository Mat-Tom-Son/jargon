"use client"
import { BusinessTermsList } from "@/components/business-terms/business-terms-list"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default function TermsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <BusinessTermsList />
        </main>
      </div>
    </div>
  )
}
