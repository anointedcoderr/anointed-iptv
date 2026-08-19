import "../styles/globals.css"
import Head from "next/head"
import { AuthProvider } from "../lib/auth-context"

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Anointed IPTV: Live HLS Streaming Demo</title>
        <meta
          name="description"
          content="Anointed IPTV is a live demo by Anointed Coder. Browse free HLS test channels, build a watchlist, and import M3U playlists."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/brand/favicon-16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/brand/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/brand/favicon-48.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/brand/apple-icon-180.png" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

