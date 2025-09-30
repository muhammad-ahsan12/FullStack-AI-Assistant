"use client"
import { useState, useRef, useEffect } from "react"
import { ChatInput } from "./chat-input"
import { Message } from "./message"
import { MessageSquare } from "lucide-react"
import type { ChatMessage } from "@/app/page"

interface ChatWindowProps {
  messages: ChatMessage[]
  updateConversationMessages: (newMessages: ChatMessage[]) => void
}

const API_BASE_URL = "http://localhost:8000"

export function ChatWindow({ messages, updateConversationMessages }: ChatWindowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendChatMessage = async (message: string): Promise<{response: string, imageUrl?: string}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          thread_id: "default-thread"
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract image URL from response if it contains one
      let imageUrl = "";
      const responseText = data.response;
      
      // Look for image URL pattern in the response
      const urlMatch = responseText.match(/https:\/\/pollinations\.ai\/p\/[^\s]+/);
      if (urlMatch) {
        imageUrl = urlMatch[0];
      }
      
      return {
        response: responseText,
        imageUrl: imageUrl
      };
    } catch (error) {
      console.error("Error sending chat message:", error)
      return {
        response: "Sorry, I encountered an error while processing your message."
      }
    }
  }

  const sendVisionMessage = async (question: string, imageFile: File): Promise<string> => {
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64String = reader.result?.toString().split(',')[1] || ''
          resolve(base64String)
        }
        reader.readAsDataURL(imageFile)
      })

      const imageUrl = `data:image/png;base64,${base64}`

      const response = await fetch(`${API_BASE_URL}/vision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          image_url: imageUrl,
          thread_id: "default-thread"
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error("Error sending vision message:", error)
      return "Sorry, I encountered an error while analyzing the image."
    }
  }

  const sendPdfMessage = async (query: string, pdfFile: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("file", pdfFile)
      formData.append("query", query)
      formData.append("thread_id", "default-thread")

      const response = await fetch(`${API_BASE_URL}/pdf`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error("Error sending PDF message:", error)
      return "Sorry, I encountered an error while processing the PDF."
    }
  }

  const handleSendMessage = async (
    messageContent: string | { question: string; imageUrl: string } | { query: string; filename: string },
    type: "text" | "image" | "pdf",
    file?: File,
  ) => {
    setIsLoading(true)

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageContent,
      type: type,
      timestamp: new Date().toLocaleTimeString(),
    }

    // Update UI with user message immediately
    updateConversationMessages([...messages, userMessage])

    try {
      let assistantResponse: string
      let imageUrl: string = ""

      // Send to appropriate API endpoint based on message type
      if (type === "image" && file) {
        const { question } = messageContent as { question: string; imageUrl: string }
        assistantResponse = await sendVisionMessage(question || "Describe this image", file)
      } 
      else if (type === "pdf" && file) {
        const { query } = messageContent as { query: string; filename: string }
        assistantResponse = await sendPdfMessage(query || "Summarize this PDF", file)
      } 
      else {
        const result = await sendChatMessage(messageContent as string)
        assistantResponse = result.response
        imageUrl = result.imageUrl || ""
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: assistantResponse,
        type: "text",
        timestamp: new Date().toLocaleTimeString(),
        ...(imageUrl && { generatedImageUrl: imageUrl })
      }

      // Update UI with AI response
      updateConversationMessages([...messages, userMessage, aiMessage])

    } catch (error) {
      console.error("Error handling message:", error)
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        type: "text",
        timestamp: new Date().toLocaleTimeString(),
      }

      updateConversationMessages([...messages, userMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground">
              Start a conversation, upload an image for analysis, share a PDF for summarization, or generate images.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Try saying: "generate image of a beautiful sunset"</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </main>
  )
}