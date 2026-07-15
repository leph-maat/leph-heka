export const metadata = {
  title: 'Leph - Heka',
  description: 'Diario de alto rendimiento',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
