export function AIChatTypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-stone-400 ai-typing-dot"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}
