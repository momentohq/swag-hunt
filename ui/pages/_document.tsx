import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.png" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
          <meta name="description" content="Search for and share the best swag at re:Invent 2023 with Swaghunt—powered by Momento" />
          <meta property="og:site_name" content="Swag Hunt" />
          <meta property="og:description" content="Search for and share the best swag at re:Invent 2023 with Swaghunt—powered by Momento" />
          <meta property="og:title" content="Swag Hunt" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Swag Hunt" />
          <meta name="twitter:description" content="Search for and share the best swag at re:Invent 2023 with Swaghunt—powered by Momento" />
        </Head>
        <body className="bg-momento-dark-forest antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
