import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Recipe Sharing App',
  description: 'Social platform for sharing and discovering cooking recipes',
  keywords: 'recipe, cooking, food, social, share, discover',
  authors: [{ name: 'Recipe Sharing App Team' }],
  creator: 'Recipe Sharing App',
  publisher: 'Recipe Sharing App',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}