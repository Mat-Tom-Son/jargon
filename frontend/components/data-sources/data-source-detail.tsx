"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  RefreshCw,
  Database,
  Globe,
  Server,
  CheckCircle,
  AlertCircle,
  Hash,
  Type,
  Calendar,
  Tag,
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataSourceDetailProps {
  sourceId: string
}

// Mock data - in real app this would come from API
const mockSourceDetail = {
  id: "1",
  name: "Salesforce Production",
  type: "REST",
  status: "active",
  description: "Production Salesforce instance",
  lastSync: "2 hours ago",
  createdAt: "2024-01-15",
  config: {
    instanceUrl: "https://company.salesforce.com",
    username: "admin@company.com",
  },
  objects: [
    {
      name: "Account",
      type: "Object",
      recordCount: 1247,
      fields: [
        { name: "Id", type: "ID", nullable: false, hint: "Primary Key" },
        { name: "Name", type: "String", nullable: false, hint: "Text Field" },
        { name: "Type", type: "String", nullable: true, hint: "Enum (Customer, Partner, Prospect)" },
        { name: "Industry", type: "String", nullable: true, hint: "Enum" },
        { name: "AnnualRevenue", type: "Currency", nullable: true, hint: "Numeric" },
        { name: "CreatedDate", type: "DateTime", nullable: false, hint: "Timestamp" },
        { name: "IsActive__c", type: "Boolean", nullable: true, hint: "Custom Field" },
      ],
    },
    {
      name: "Contact",
      type: "Object",
      recordCount: 3891,
      fields: [
        { name: "Id", type: "ID", nullable: false, hint: "Primary Key" },
        { name: "FirstName", type: "String", nullable: true, hint: "Text Field" },
        { name: "LastName", type: "String", nullable: false, hint: "Text Field" },
        { name: "Email", type: "Email", nullable: true, hint: "Email Format" },
        { name: "AccountId", type: "Reference", nullable: true, hint: "Foreign Key to Account" },
        { name: "CreatedDate", type: "DateTime", nullable: false, hint: "Timestamp" },
      ],
    },
    {
      name: "Opportunity",
      type: "Object",
      recordCount: 892,
      fields: [
        { name: "Id", type: "ID", nullable: false, hint: "Primary Key" },
        { name: "Name", type: "String", nullable: false, hint: "Text Field" },
        { name: "Amount", type: "Currency", nullable: true, hint: "Numeric" },
        { name: "StageName", type: "String", nullable: false, hint: "Enum (Prospecting, Qualification, etc.)" },
        { name: "CloseDate", type: "Date", nullable: false, hint: "Date Field" },
        { name: "AccountId", type: "Reference", nullable: false, hint: "Foreign Key to Account" },
      ],
    },
  ],
}

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "id":
    case "reference":
      return Hash
    case "string":
    case "email":
      return Type
    case "datetime":
    case "date":
      return Calendar
    default:
      return Tag
  }
}

export function DataSourceDetail({ sourceId }: DataSourceDetailProps) {
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [selectedObject, setSelectedObject] = useState<string>(mockSourceDetail.objects[0]?.name || "")

  const handleDiscoverSchema = async () => {
    setIsDiscovering(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDiscovering(false)
  }

  const selectedObjectData = mockSourceDetail.objects.find((obj) => obj.name === selectedObject)
  const Icon = mockSourceDetail.type === "REST" ? Globe : mockSourceDetail.type === "PostgreSQL" ? Database : Server

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sources
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{mockSourceDetail.name}</h1>
            <p className="text-muted-foreground mt-1">{mockSourceDetail.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={mockSourceDetail.status === "active" ? "default" : "secondary"}>
                {mockSourceDetail.status}
              </Badge>
              <span className="text-sm text-muted-foreground">Last sync: {mockSourceDetail.lastSync}</span>
            </div>
          </div>
        </div>
        <Button onClick={handleDiscoverSchema} disabled={isDiscovering}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? "animate-spin" : ""}`} />
          {isDiscovering ? "Discovering..." : "Discover Schema"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Objects List */}
        <Card>
          <CardHeader>
            <CardTitle>Objects</CardTitle>
            <CardDescription>{mockSourceDetail.objects.length} discovered objects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockSourceDetail.objects.map((object) => (
              <div
                key={object.name}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedObject === object.name ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedObject(object.name)}
              >
                <div className="font-medium">{object.name}</div>
                <div className="text-sm text-muted-foreground">{object.recordCount.toLocaleString()} records</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Object Details */}
        <div className="lg:col-span-3">
          {selectedObjectData && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedObjectData.name} Schema</CardTitle>
                <CardDescription>
                  {selectedObjectData.fields.length} fields • {selectedObjectData.recordCount.toLocaleString()} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nullable</TableHead>
                      <TableHead>Profiling Hint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedObjectData.fields.map((field) => {
                      const TypeIcon = getTypeIcon(field.type)
                      return (
                        <TableRow key={field.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              {field.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{field.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {field.nullable ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{field.hint}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
