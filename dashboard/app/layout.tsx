import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Providers } from "@/providers"

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dashboard.stablepay.stability.nexus/"
const SITE_NAME = "StablePay"
const DEFAULT_TITLE = "StablePay"
const DEFAULT_DESCRIPTION =
  "StablePay merchant dashboard for tracking payment widget performance and transaction analytics."
const OG_IMAGE = "/djed-alliance.png"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | StablePay",
    default: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
  canonical: "https://dashboard.stablepay.stability.nexus",
},
  keywords: ["crypto payments", "stablecoin", "merchant dashboard", "USDC", "payment widget", "StablePay"],
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "StablePay Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aossie_org", 
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/fonts/Rebels-Fett.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`}>
        <Providers>
          <SidebarProvider>
            <MobileHeader />

            {/* Desktop Layout */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
              <div className="col-span-2 top-0 relative">
                <DashboardSidebar />
              </div>
              <div className="col-span-1 lg:col-span-10">{children}</div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
