import { cn } from "@/lib/utils"
import { User, Bot, ImageIcon, Download } from "lucide-react"
import type { ChatMessage } from "@/app/page"

interface MessageProps {
  message: ChatMessage
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user"

  // Function to download image
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  // Function to extract clean text without the URL
  const getCleanText = (content: string) => {
    // Remove the image URL from the text
    return content.replace(/https:\/\/pollinations\.ai\/p\/[^\s]+/, '').trim()
  }

  return (
    <div className={cn("flex gap-4 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={cn("flex flex-col max-w-[80%] md:max-w-[70%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md",
            isUser
              ? "bg-[color:var(--chat-user-bg)] text-[color:var(--chat-user-fg)] rounded-br-md animate-slide-in-right"
              : "bg-[color:var(--chat-ai-bg)] text-[color:var(--chat-ai-fg)] border border-border rounded-bl-md animate-slide-in-left",
          )}
        >
          {message.type === "text" && (
            <div className="text-sm leading-relaxed text-balance whitespace-pre-wrap">
              {/* Display clean text without URL */}
              <p>{getCleanText(message.content as string)}</p>
              
              {/* Display generated image if available */}
              {message.generatedImageUrl && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Generated Image</span>
                    </div>
                    <button
                      onClick={() => downloadImage(message.generatedImageUrl!, 'ai-generated-image.jpg')}
                      className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  <img
                    src={message.generatedImageUrl}
                    alt="AI Generated"
                    className="max-w-full h-auto rounded-lg border border-border/50 max-h-64 object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {message.type === "image" && typeof message.content === "object" && "imageUrl" in message.content && (
            <div className="flex flex-col gap-3">
              <img
                src={message.content.imageUrl || "/placeholder.svg"}
                alt={message.content.question || "Uploaded image"}
                className="max-w-full h-auto rounded-lg border border-border/50 max-h-64 object-contain"
              />
              <p className="text-sm">
                <span className="font-medium">Question:</span> {message.content.question}
              </p>
            </div>
          )}

          {message.type === "pdf" && typeof message.content === "object" && "filename" in message.content && (
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                <span className="font-medium">Query:</span> {message.content.query}
              </p>
              <p className="text-xs opacity-70">
                <span className="font-medium">File:</span> {message.content.filename}
              </p>
            </div>
          )}
        </div>

        <span className="text-xs text-muted-foreground mt-1 px-1">{message.timestamp}</span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}