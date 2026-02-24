export const metadata = {
  title: 'Feedback - TinyFeedback',
  description: 'Envie seu feedback',
}

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
