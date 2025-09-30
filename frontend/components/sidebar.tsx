"use client"

import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { cn } from "@/lib/utils"
import { Plus, MessageSquare, Trash2, Menu } from "lucide-react"
import type { Conversation } from "@/app/page"
import { useState } from "react"

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  createNewChat: () => void
  loadConversation: (id: string) => void
  deleteConversation: (id: string) => void
}

export function Sidebar({
  conversations,
  currentConversationId,
  createNewChat,
  loadConversation,
  deleteConversation,
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-screen bg-sidebar border-r border-sidebar-border shadow-sm">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground mb-4">Chat With BOb!</h1>

        <Button
          onClick={createNewChat}
          className="w-full flex items-center gap-2 py-3 px-4 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md rounded-lg group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
        <div className="p-2">
          <h2 className="text-sm font-medium text-sidebar-foreground/70 mb-3 px-2">Recent Chats</h2>
          {conversations.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <MessageSquare className="w-8 h-8 text-sidebar-foreground/30 mx-auto mb-2" />
              <p className="text-sidebar-foreground/50 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out group hover:bg-sidebar-accent animate-fade-in-scale",
                  currentConversationId === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                )}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="flex-1 truncate">
                  <p className="font-medium text-sm text-balance truncate">{conv.title}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{conv.createdAt}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-auto w-auto hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 text-center">Powered by FastAPI & React</p>
      </div>
    </aside>
  )
}
