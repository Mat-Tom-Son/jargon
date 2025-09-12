"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface AddBusinessTermDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categories = ["Customer", "Sales", "Finance", "Marketing", "Operations", "Product"]
const owners = ["Sarah Johnson", "Mike Chen", "Emily Davis", "Alex Rodriguez", "Lisa Wang", "David Brown"]

export function AddBusinessTermDialog({ open, onOpenChange }: AddBusinessTermDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    owner: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3001/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          owner: formData.owner,
          tags: formData.tags,
        }),
      });

      if (response.ok) {
        const newTerm = await response.json();
        console.log("Created business term:", newTerm);
        onOpenChange(false);
        setFormData({
          name: "",
          description: "",
          category: "",
          owner: "",
          tags: [],
        });
        setNewTag("");
        // Optionally trigger a refresh of the parent component
        window.location.reload(); // Simple refresh for now
      } else {
        console.error("Failed to create business term");
      }
    } catch (error) {
      console.error("Error creating business term:", error);
    }
  }

  const isValid = formData.name.trim() && formData.description.trim() && formData.category && formData.owner

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Business Term</DialogTitle>
          <DialogDescription>
            Define a new business term that can be mapped to data sources and used in queries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Term Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Active Customer"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a clear, detailed definition of this business term..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner *</Label>
            <Select value={formData.owner} onValueChange={(value) => handleInputChange("owner", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags (press Enter)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Create Term
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
