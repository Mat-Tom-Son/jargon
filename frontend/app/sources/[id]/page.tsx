import { DataSourceDetail } from "@/components/data-sources/data-source-detail"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface SourceDetailPageProps {
  params: {
    id: string
  }
}

export default function SourceDetailPage({ params }: SourceDetailPageProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <DataSourceDetail sourceId={params.id} />
        </main>
      </div>
    </div>
  )
}
