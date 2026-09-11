export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen h-screen bg-stone-50 overflow-hidden">
      {children}
    </div>
  )
}
