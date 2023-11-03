import '@/app/ui/global.css'
import { inter } from '@/app/ui/fonts'

import React, { ReactNode } from 'react'
import { Metadata } from 'next'

type Props = {
  children: ReactNode
}

export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
}

const RootLayout = ({ children }: Props) => {
  return (
    <html lang='en'>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}

export default RootLayout
