"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Database, BookOpen, GitBranch, TestTube, BarChart3, CheckCircle, Users, Settings } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Data Sources", href: "/sources", icon: Database },
  { name: "Business Terms", href: "/terms", icon: BookOpen },
  { name: "Mapping Rules", href: "/mappings", icon: GitBranch },
  { name: "Query Builder", href: "/test", icon: TestTube },
  { name: "Semantic Debt", href: "/semantic-debt", icon: CheckCircle },
  { name: "Governance", href: "/governance", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src="/jargon-ai.png"
              alt="Jargon AI Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to shield icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<svg class="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Jargon AI</h1>
            <p className="text-xs text-muted-foreground">Translation Layer</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Enterprise Admin Console</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Version 0.1.0</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="System Online"></div>
        </div>
        <div className="text-xs text-muted-foreground/70">
          © 2025 Jargon AI, Inc.
        </div>
      </div>
    </div>
  )
}
