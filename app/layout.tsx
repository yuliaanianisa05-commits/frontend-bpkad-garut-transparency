import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "BPKAD Kabupaten Garut - Transparansi Anggaran Daerah",
  description:
    "Sistem Informasi Anggaran Pendapatan dan Belanja Daerah (BPKAD) Kabupaten Garut untuk transparansi dan akuntabilitas pengelolaan keuangan daerah",
  keywords: "BPKAD, Kabupaten Garut, anggaran daerah, transparansi, keuangan daerah",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
