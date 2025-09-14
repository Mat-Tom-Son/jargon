"use client"
import { DataSourceDetail } from "@/components/data-sources/data-source-detail"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { useParams } from "next/navigation"

export default function SourceDetailPage() {
  const p: any = useParams()
  const id = Array.isArray(p?.id) ? String(p.id[0]) : String(p?.id || "")
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <DataSourceDetail sourceId={id} />
        </main>
      </div>
    </div>
  )
}
