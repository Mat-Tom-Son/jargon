"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Code, ArrowRight } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FieldMapping {
  semantic: string
  concrete: string
  expression: string
}

interface FieldMappingEditorProps {
  termName: string
  sourceName: string
  objectName: string
  fieldMappings: FieldMapping[]
  onFieldMappingsChange: (mappings: FieldMapping[]) => void
  concreteFields?: string[]
}

// Mock semantic fields based on term - organized by category
const getSemanticFields = (termName: string) => {
  const fieldMap: Record<string, { name: string; description: string; type: string }[]> = {
    "Active Customer": [
      { name: "Customer Identifier", description: "Unique identifier for the customer", type: "ID" },
      { name: "Customer Name", description: "Full name of the customer", type: "String" },
      { name: "Customer Email", description: "Primary email address", type: "String" },
      { name: "Active Customer Status", description: "Whether customer is currently active", type: "Boolean" },
      { name: "Customer Since", description: "Date customer was acquired", type: "Date" },
      { name: "Last Activity Date", description: "Date of last customer interaction", type: "Date" },
    ],
    "Opportunity Value": [
      { name: "Opportunity Identifier", description: "Unique opportunity ID", type: "ID" },
      { name: "Opportunity Name", description: "Name/title of the opportunity", type: "String" },
      { name: "Opportunity Value Amount", description: "Monetary value of the opportunity", type: "Number" },
      { name: "Revenue Currency", description: "Currency of the opportunity value", type: "String" },
      { name: "Sales Stage", description: "Current stage in sales process", type: "String" },
      { name: "Expected Close Date", description: "Anticipated closure date", type: "Date" },
      { name: "Win Probability", description: "Probability of winning the deal", type: "Number" },
    ],
    "Monthly Recurring Revenue": [
      { name: "Customer Reference ID", description: "Reference to the customer", type: "ID" },
      { name: "Monthly Revenue Amount", description: "Monthly recurring revenue amount", type: "Number" },
      { name: "Revenue Currency", description: "Currency of the revenue", type: "String" },
      { name: "Subscription Start Date", description: "When the subscription began", type: "Date" },
      { name: "Subscription End Date", description: "When the subscription ends", type: "Date" },
      { name: "Subscription Status", description: "Current status of subscription", type: "String" },
    ],
    "Lead Score": [
      { name: "Lead Identifier", description: "Unique lead identifier", type: "ID" },
      { name: "Lead Email", description: "Lead's email address", type: "String" },
      { name: "Lead Quality Score", description: "Numerical quality score", type: "Number" },
      { name: "Lead Source", description: "Where the lead came from", type: "String" },
      { name: "Last Modified Date", description: "When lead was last updated", type: "Date" },
      { name: "Lead Status", description: "Current status of the lead", type: "String" },
      { name: "Campaign Identifier", description: "Associated campaign ID", type: "ID" },
    ],
  }
  return fieldMap[termName] || [
    { name: "Identifier", description: "Unique identifier", type: "ID" },
    { name: "Name", description: "Display name", type: "String" },
    { name: "Value", description: "Primary value field", type: "Number" },
    { name: "Status", description: "Current status", type: "String" },
    { name: "Created Date", description: "Date created", type: "Date" },
  ]
}

// Mock concrete fields based on object (fallback when discovery is unavailable)
const getConcreteFields = (objectName: string) => {
  const fieldMap: Record<string, string[]> = {
    Account: ["Id", "Name", "Type", "Industry", "AnnualRevenue", "CreatedDate", "Active__c", "Status__c"],
    Contact: ["Id", "FirstName", "LastName", "Email", "AccountId", "CreatedDate", "Phone"],
    Opportunity: ["Id", "Name", "Amount", "StageName", "CloseDate", "AccountId", "Probability"],
    customers: ["id", "name", "email", "status", "created_at", "updated_at", "subscription_status"],
    orders: ["id", "customer_id", "total_amount", "currency", "status", "created_at", "updated_at"],
    subscriptions: ["id", "customer_id", "monthly_amount", "currency_code", "status", "start_date", "end_date"],
    leads: ["lead_id", "email", "score", "source", "updated_at", "status", "campaign_id"],
    events: ["id", "user_id", "event_type", "properties", "timestamp", "session_id"],
    campaigns: ["id", "name", "type", "status", "start_date", "end_date", "budget"],
  }
  return fieldMap[objectName] || ["id", "name", "value", "created_at"]
}

export function FieldMappingEditor({
  termName,
  sourceName,
  objectName,
  fieldMappings,
  onFieldMappingsChange,
  concreteFields: concreteFieldsProp,
}: FieldMappingEditorProps) {
  const [newSemanticField, setNewSemanticField] = useState("")
  const semanticFields = getSemanticFields(termName)
  const semanticFieldNames = semanticFields.map(field => field.name)
  const concreteFields = (concreteFieldsProp && concreteFieldsProp.length)
    ? concreteFieldsProp
    : getConcreteFields(objectName)

  const addFieldMapping = (semanticField?: string) => {
    const field = semanticField || newSemanticField.trim()
    if (field && !fieldMappings.find((m) => m.semantic === field)) {
      const newMapping: FieldMapping = {
        semantic: field,
        concrete: "",
        expression: "",
      }
      onFieldMappingsChange([...fieldMappings, newMapping])
      setNewSemanticField("")
    }
  }

  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updated = fieldMappings.map((mapping, i) => (i === index ? { ...mapping, ...updates } : mapping))
    onFieldMappingsChange(updated)
  }

  const removeFieldMapping = (index: number) => {
    onFieldMappingsChange(fieldMappings.filter((_, i) => i !== index))
  }

  const addSuggestedField = (field: string) => {
    addFieldMapping(field)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Field-Level Mapping</CardTitle>
          <CardDescription>
            Map semantic fields from "{termName}" to concrete fields in {sourceName} → {objectName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Suggested Fields */}
          <div>
            <Label className="text-sm font-medium">Suggested Semantic Fields</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {semanticFields
                .filter((field) => !fieldMappings.find((m) => m.semantic === field.name))
                .map((field) => (
                  <Button
                    key={field.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addSuggestedField(field.name)}
                    className="text-xs"
                    title={field.description}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {field.name}
                  </Button>
                ))}
            </div>
          </div>

          {/* Add Custom Field */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom semantic field..."
              value={newSemanticField}
              onChange={(e) => setNewSemanticField(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addFieldMapping()}
            />
            <Button onClick={() => addFieldMapping()} disabled={!newSemanticField.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Field Mappings */}
      <div className="space-y-4">
        {fieldMappings.map((mapping, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Semantic Field */}
                <div className="lg:col-span-3">
                  <Label className="text-sm font-medium">Semantic Field</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {mapping.semantic}
                    </Badge>
                  </div>
                </div>

                <div className="lg:col-span-1 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Concrete Field Selection */}
                <div className="lg:col-span-3">
                  <Label className="text-sm font-medium">Concrete Field</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-mono text-sm bg-transparent">
                        {mapping.concrete || "Select field..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0">
                      <Command>
                        <CommandInput placeholder="Search fields..." />
                        <CommandList>
                          <CommandEmpty>No fields found.</CommandEmpty>
                          <CommandGroup>
                            {concreteFields.map((field) => (
                              <CommandItem
                                key={field}
                                onSelect={() => {
                                  updateFieldMapping(index, {
                                    concrete: field,
                                    expression: mapping.expression || field,
                                  })
                                }}
                              >
                                <Code className="h-4 w-4 mr-2" />
                                {field}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Expression */}
                <div className="lg:col-span-4">
                  <Label className="text-sm font-medium">Expression</Label>
                  <Textarea
                    placeholder="Enter expression (e.g., Active__c = true AND Status__c != 'Churned')"
                    value={mapping.expression}
                    onChange={(e) => updateFieldMapping(index, { expression: e.target.value })}
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Remove Button */}
                <div className="lg:col-span-1 flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFieldMapping(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fieldMappings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Code className="h-8 w-8 mx-auto mb-2" />
          <p>No field mappings yet. Add semantic fields to get started.</p>
        </div>
      )}
    </div>
  )
}
