"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatWindow } from "@/components/chat-window"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string | { question: string; imageUrl: string } | { query: string; filename: string }
  type: "text" | "image" | "pdf"
  timestamp: string
  generatedImageUrl?: string // ADD THIS LINE
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations")
    if (storedConversations) {
      const parsedConversations: Conversation[] = JSON.parse(storedConversations)
      setConversations(parsedConversations)
      // Set the most recent conversation as current, or create a new one if none exist
      if (parsedConversations.length > 0) {
        setCurrentConversationId(parsedConversations[0].id)
      } else {
        createNewChat()
      }
    } else {
      createNewChat()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  const createNewChat = () => {
    const newId = `chat-${Date.now()}`
    const newConversation: Conversation = {
      id: newId,
      title: `New Chat ${conversations.length + 1}`,
      createdAt: new Date().toLocaleString(),
      messages: [],
    }
    setConversations((prev) => [newConversation, ...prev])
    setCurrentConversationId(newId)
  }

  const loadConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) {
      alert("Cannot delete the last conversation!")
      return
    }
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (currentConversationId === id) {
      // Switch to the first available conversation or create a new one
      setCurrentConversationId(conversations.filter((conv) => conv.id !== id)[0]?.id || null)
      if (conversations.length === 1) {
        createNewChat()
      }
    }
  }

  const updateConversationMessages = (newMessages: ChatMessage[]) => {
    setConversations((prev) =>
      prev.map((conv) => 
        conv.id === currentConversationId ? { 
          ...conv, 
          messages: newMessages,
          // Update conversation title based on first user message
          title: newMessages.length > 0 && newMessages[0].role === "user" 
            ? (typeof newMessages[0].content === "string" 
                ? newMessages[0].content.substring(0, 30) + (newMessages[0].content.length > 30 ? "..." : "")
                : "Image/PDF Chat")
            : conv.title
        } : conv
      ),
    )
  }

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        createNewChat={createNewChat}
        loadConversation={loadConversation}
        deleteConversation={deleteConversation}
      />
      <ChatWindow
        messages={currentConversation?.messages || []}
        updateConversationMessages={updateConversationMessages}
      />
    </div>
  )
}