"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Globe, Server } from "lucide-react"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

interface AddDataSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const sourceTypes = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Connect to Salesforce CRM",
    icon: Globe,
    fields: [
      { name: "instanceUrl", label: "Instance URL", type: "url", placeholder: "https://your-instance.salesforce.com" },
      { name: "username", label: "Username", type: "text" },
      { name: "password", label: "Password", type: "password" },
      { name: "securityToken", label: "Security Token", type: "password" },
    ],
  },
  {
    id: "rest",
    name: "REST API",
    description: "Generic REST API connection",
    icon: Server,
    fields: [
      { name: "baseUrl", label: "Base URL", type: "url", placeholder: "https://api.example.com" },
      { name: "apiKey", label: "API Key", type: "password" },
      { name: "authHeader", label: "Auth Header", type: "text", placeholder: "Authorization" },
    ],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "PostgreSQL database connection",
    icon: Database,
    fields: [
      { name: "host", label: "Host", type: "text", placeholder: "localhost" },
      { name: "port", label: "Port", type: "number", placeholder: "5432" },
      { name: "database", label: "Database", type: "text" },
      { name: "username", label: "Username", type: "text" },
      { name: "password", label: "Password", type: "password" },
    ],
  },
]

export function AddDataSourceDialog({ open, onOpenChange }: AddDataSourceDialogProps) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setStep(2)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.sources), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          kind: selectedType,
          config: Object.fromEntries(
            Object.entries(formData).filter(([key]) =>
              !['name', 'description'].includes(key)
            )
          )
        }),
      });

      if (response.ok) {
        const newSource = await response.json();
        console.log("Created data source:", newSource);
        onOpenChange(false);
        setStep(1);
        setSelectedType("");
        setFormData({});
        // Optionally trigger a refresh of the parent component
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Failed to create data source");
      }
    } catch (error) {
      console.error("Error creating data source:", error);
    }
  }

  const selectedTypeConfig = sourceTypes.find((t) => t.id === selectedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Data Source</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose the type of data source you want to connect."
              : `Configure your ${selectedTypeConfig?.name} connection.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sourceTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto p-3 bg-muted rounded-lg w-fit">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm">{type.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {step === 2 && selectedTypeConfig && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Data Source Name</Label>
              <Input
                id="name"
                placeholder="Enter a name for this data source"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            {selectedTypeConfig.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Create Data Source</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
