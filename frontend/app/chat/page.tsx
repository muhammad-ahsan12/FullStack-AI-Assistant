"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ChatWindow } from "@/components/chat-window";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | { question: string; imageUrl: string } | { query: string; filename: string };
  type: "text" | "image" | "pdf";
  timestamp: string;
  generatedImageUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export default function ChatPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // ✅ Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  // ✅ Load stored conversations
  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations");
    if (storedConversations) {
      const parsedConversations: Conversation[] = JSON.parse(storedConversations);
      setConversations(parsedConversations);
      if (parsedConversations.length > 0) {
        setCurrentConversationId(parsedConversations[0].id);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // ✅ Save conversations
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: `New Chat ${conversations.length + 1}`,
      createdAt: new Date().toLocaleString(),
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);
  };

  const loadConversation = (id: string) => setCurrentConversationId(id);

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) {
      alert("Cannot delete the last conversation!");
      return;
    }
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(conversations.filter((conv) => conv.id !== id)[0]?.id || null);
      if (conversations.length === 1) createNewChat();
    }
  };

  const updateConversationMessages = (newMessages: ChatMessage[]) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: newMessages,
              title:
                newMessages.length > 0 && newMessages[0].role === "user"
                  ? typeof newMessages[0].content === "string"
                    ? newMessages[0].content.substring(0, 30) +
                      (newMessages[0].content.length > 30 ? "..." : "")
                    : "Image/PDF Chat"
                  : conv.title,
            }
          : conv
      )
    );
  };

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId);

  // ✅ Prevent chat from showing until authenticated
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white text-xl">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen overflow-hidden bg-background relative">
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
  );
}
