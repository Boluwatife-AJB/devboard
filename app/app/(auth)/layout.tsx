export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <h1 className="text-4xl font-bold text-center mb-4">DevBoard Auth</h1>
      {children}
    </div>
  )
}