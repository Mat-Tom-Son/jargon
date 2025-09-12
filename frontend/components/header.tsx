"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, HelpCircle, Moon, Sun } from "lucide-react"
import { usePathname } from "next/navigation"

const getPageTitle = (pathname: string) => {
  if (pathname === "/") return "Dashboard Overview"
  if (pathname === "/sources") return "Data Sources"
  if (pathname.startsWith("/sources/")) return "Data Source Details"
  if (pathname === "/terms") return "Business Terms"
  if (pathname === "/mappings") return "Mapping Rules"
  if (pathname === "/test") return "Query Testing"
  if (pathname === "/semantic-debt") return "Semantic Debt Dashboard"
  if (pathname === "/governance") return "Semantic Governance"
  return "Admin Console"
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">Manage your semantic data layer</p>
        </div>
        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          System Live
        </Badge>
      </div>

      <div className="flex items-center gap-3">

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/user-avatar.png" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">admin@jargon.ai</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
