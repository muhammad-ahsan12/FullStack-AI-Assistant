"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Plus, Send, ImageIcon, FileText, X } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (
    content: string | { question: string; imageUrl: string } | { query: string; filename: string },
    type: "text" | "image" | "pdf",
    file?: File,
  ) => void
  isLoading: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null)
  const [showFileOptions, setShowFileOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if ((!input.trim() && !selectedFile) || isLoading) return

    if (selectedFile && fileType) {
      if (fileType === "image") {
        onSendMessage(
          { 
            question: input || "Please describe this image", 
            imageUrl: URL.createObjectURL(selectedFile) 
          }, 
          "image", 
          selectedFile
        )
      } else if (fileType === "pdf") {
        onSendMessage(
          { 
            query: input || "Summarize this PDF", 
            filename: selectedFile.name 
          }, 
          "pdf", 
          selectedFile
        )
      }
    } else if (input.trim()) {
      onSendMessage(input, "text")
    }

    // Reset form
    setInput("")
    setSelectedFile(null)
    setFileType(null)
    setShowFileOptions(false)
  }

  const handleFileSelect = (type: "image" | "pdf") => {
    setFileType(type)
    if (type === "image") {
      imageInputRef.current?.click()
    } else {
      pdfInputRef.current?.click()
    }
    setShowFileOptions(false)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf") => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileType(type)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFileType(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
    if (pdfInputRef.current) pdfInputRef.current.value = ""
  }

  return (
    <div className="relative">
      {selectedFile && (
        <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between animate-fade-in-scale">
          <div className="flex items-center gap-2">
            {fileType === "image" ? (
              <ImageIcon className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm font-medium">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            disabled={isLoading}
            className="h-auto p-1 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="relative flex items-end gap-2 p-3 bg-card border border-border rounded-2xl shadow-sm focus-within:shadow-md transition-all duration-200">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileOptions(!showFileOptions)}
            disabled={isLoading}
            className={cn(
              "h-8 w-8 p-0 rounded-full hover:bg-muted transition-all duration-200",
              showFileOptions && "bg-muted",
            )}
          >
            <Plus className={cn("w-4 h-4 transition-transform duration-200", showFileOptions && "rotate-45")} />
          </Button>

          {showFileOptions && (
            <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg p-1 animate-fade-in-scale">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileSelect("image")}
                className="w-full justify-start gap-2 text-sm hover:bg-muted"
                disabled={isLoading}
              >
                <ImageIcon className="w-4 h-4" />
                Upload Image
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileSelect("pdf")}
                className="w-full justify-start gap-2 text-sm hover:bg-muted"
                disabled={isLoading}
              >
                <FileText className="w-4 h-4" />
                Upload PDF
              </Button>
            </div>
          )}
        </div>

        <Textarea
          placeholder={selectedFile ? `Ask a question about your ${fileType}...` : "Message ChatBot AI..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="flex-1 min-h-[20px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          rows={1}
          disabled={isLoading}
        />

        <Button
          onClick={handleSend}
          disabled={(!input.trim() && !selectedFile) || isLoading}
          size="sm"
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-200",
            (input.trim() || selectedFile) && !isLoading
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:scale-105"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "image")}
        className="hidden"
        disabled={isLoading}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileChange(e, "pdf")}
        className="hidden"
        disabled={isLoading}
      />
    </div>
  )
}