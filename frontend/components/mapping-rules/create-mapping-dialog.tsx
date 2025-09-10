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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { FieldMappingEditor } from "./field-mapping-editor"

interface CreateMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateMapping?: (mapping: any) => void
}

// Mock data
const mockTerms = [
  { id: "1", name: "Active Customer", category: "Customer" },
  { id: "2", name: "Opportunity Value", category: "Sales" },
  { id: "3", name: "Monthly Recurring Revenue", category: "Finance" },
  { id: "4", name: "Lead Score", category: "Marketing" },
]

const mockSources = [
  { id: "1", name: "Salesforce Production", type: "REST" },
  { id: "2", name: "Customer Database", type: "PostgreSQL" },
  { id: "3", name: "Analytics API", type: "REST" },
]

const mockObjects = {
  "1": [
    { name: "Account", recordCount: 1247 },
    { name: "Contact", recordCount: 3891 },
    { name: "Opportunity", recordCount: 892 },
  ],
  "2": [
    { name: "customers", recordCount: 2156 },
    { name: "orders", recordCount: 8934 },
    { name: "subscriptions", recordCount: 1543 },
  ],
  "3": [
    { name: "leads", recordCount: 4521 },
    { name: "events", recordCount: 125678 },
    { name: "campaigns", recordCount: 234 },
  ],
}

const steps = [
  { id: 1, name: "Core Info", description: "Select term and data source" },
  { id: 2, name: "Object Mapping", description: "Choose source object" },
  { id: 3, name: "Field Mapping", description: "Map semantic fields" },
  { id: 4, name: "Review Mapping", description: "Confirm your mapping" },
]

export function CreateMappingDialog({ open, onOpenChange, onCreateMapping }: CreateMappingDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    termId: "",
    sourceId: "",
    objectName: "",
    fieldMappings: [] as Array<{ semantic: string; concrete: string; expression: string }>,
  })

  const selectedTerm = mockTerms.find((t) => t.id === formData.termId)
  const selectedSource = mockSources.find((s) => s.id === formData.sourceId)
  const availableObjects = formData.sourceId ? mockObjects[formData.sourceId as keyof typeof mockObjects] || [] : []

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (onCreateMapping) {
      const selectedTerm = mockTerms.find(t => t.id === formData.termId)
      const selectedSource = mockSources.find(s => s.id === formData.sourceId)

      // Create mapping with all the field mappings that were configured
      const mappingData = {
        termName: selectedTerm?.name || "",
        termCategory: selectedTerm?.category || "",
        sourceName: selectedSource?.name || "",
        sourceType: selectedSource?.type || "",
        objectName: formData.objectName,
        fieldMappings: formData.fieldMappings.length > 0 ? formData.fieldMappings : [
          {
            semantic: selectedTerm?.name || "",
            concrete: formData.objectName,
            expression: formData.objectName
          }
        ],
      }

      onCreateMapping(mappingData)
    }

    onOpenChange(false)
    setCurrentStep(1)
    setFormData({
      termId: "",
      sourceId: "",
      objectName: "",
      fieldMappings: [],
    })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.termId && formData.sourceId
      case 2:
        return formData.objectName
      case 3:
        return true // Allow proceeding even if no field mappings configured
      case 4:
        return true // Always allow proceeding to submit
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Mapping Rule</DialogTitle>
          <DialogDescription>Connect a business term to concrete data source fields.</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{step.name}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="w-12 h-px bg-border mx-4" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {/* Step 1: Core Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Term</Label>
                  <Select
                    value={formData.termId}
                    onValueChange={(value) => setFormData({ ...formData, termId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business term" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTerms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          <div>
                            <div className="font-medium">{term.name}</div>
                            <div className="text-sm text-muted-foreground">{term.category}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select
                    value={formData.sourceId}
                    onValueChange={(value) => setFormData({ ...formData, sourceId: value, objectName: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">{source.type}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTerm && selectedSource && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mapping Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline">{selectedTerm.name}</Badge>
                        <span className="mx-2">→</span>
                        <Badge variant="outline">{selectedSource.name}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedTerm.category} • {selectedSource.type}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Object Mapping */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Select Object from {selectedSource?.name}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {availableObjects.map((object) => (
                    <Card
                      key={object.name}
                      className={`cursor-pointer transition-colors ${
                        formData.objectName === object.name ? "ring-2 ring-primary bg-accent" : "hover:bg-accent"
                      }`}
                      onClick={() => setFormData({ ...formData, objectName: object.name })}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{object.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{object.recordCount.toLocaleString()} records</CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Field Mapping */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <FieldMappingEditor
                termName={selectedTerm?.name || ""}
                sourceName={selectedSource?.name || ""}
                objectName={formData.objectName}
                fieldMappings={formData.fieldMappings}
                onFieldMappingsChange={(mappings) => setFormData({ ...formData, fieldMappings: mappings })}
              />
            </div>
          )}

          {/* Step 4: Review Mapping */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mapping Summary</CardTitle>
                  <CardDescription>Review your mapping configuration before creating.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Business Term</Label>
                      <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {selectedTerm?.name}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {selectedTerm?.category}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Data Source</Label>
                      <div className="mt-1 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-sm font-medium text-green-900 dark:text-green-100">
                          {selectedSource?.name}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          {formData.objectName}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Field Mappings ({formData.fieldMappings.length})</Label>
                    <div className="mt-2 space-y-2">
                      {formData.fieldMappings.length > 0 ? (
                        formData.fieldMappings.map((mapping, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {mapping.semantic}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {mapping.concrete}
                            </Badge>
                            {mapping.expression && mapping.expression !== mapping.concrete && (
                              <span className="text-xs text-gray-500 ml-2">({mapping.expression})</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No field mappings configured
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()}>
                Create Mapping
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
