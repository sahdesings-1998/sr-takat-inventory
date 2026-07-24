import { useState } from "react";
import { Sparkles, User, Copy, Check } from "lucide-react";

/**
 * Renders Markdown-style text (bold, lists, code, line breaks)
 */
function FormattedText({ text }) {
  if (!text) return null;

  // Split into paragraphs / lines
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        let trimmed = line.trim();

        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 / Bold header
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-gray-900 text-sm mt-2 mb-1">
              {trimmed.replace(/^###\s+/, "")}
            </h4>
          );
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(content) }} />
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-indigo-600 shrink-0">{match[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(match[2]) }} />
            </div>
          );
        }

        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(str) {
  if (!str) return "";
  let html = str;
  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-gray-900'>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong class='font-bold text-gray-900'>$1</strong>");
  // Inline code `code`
  html = html.replace(/`(.*?)`/g, "<code class='bg-gray-100 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-700'>$1</code>");
  return html;
}

export default function ChatMessageBubble({ message }) {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-xs ${
        isUser
          ? "bg-indigo-600 text-white rounded-br-none"
          : message.isRefusal
          ? "bg-amber-50/90 border border-amber-200 text-amber-950 rounded-bl-none"
          : message.isError
          ? "bg-rose-50 border border-rose-200 text-rose-950 rounded-bl-none"
          : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
      }`}>
        <FormattedText text={message.text} />

        <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-black/5 text-[10px]">
          <span className={isUser ? "text-indigo-200" : "text-gray-400 font-medium"}>
            {message.timestamp}
          </span>

          {!isUser && !message.isError && (
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 font-semibold transition-colors"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" /> <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
