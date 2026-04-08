import "../styles/globals.css"
import Head from "next/head"

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Anointed IPTV — Live HLS Streaming Demo</title>
        <meta
          name="description"
          content="Anointed IPTV is a live demo by Anointed Coder. Browse free HLS test channels, build a watchlist, and import M3U playlists."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
