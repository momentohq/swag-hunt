import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Bridge from '../components/Icons/Bridge'
import Logo from '../components/Icons/Logo'
import SubmitForm from '../components/SubmitForm'
import type { SwagSummary } from '../utils/types'
import { useLastViewedPhoto } from '../utils/useLastViewedPhoto'
import { getSwagList, swagSearch } from '../services/SwagService'
import { toTitleCase } from '../utils/titleCase'

const Home: NextPage = ({ swag, pageToken }: { swag: SwagSummary[], pageToken?: string }) => {
  const router = useRouter()
  const { photoId } = router.query
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();
  const [showAddSwag, setShowAddSwag] = useState<Boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: 'center' })
      setLastViewedPhoto(null)
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto])

  const handleSearchQueryChanged = async (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setSearchQuery('');
      const results = await swagSearch(searchQuery);
      swag = results.swag;
    }
  }

  return (
    <>
      <Head>
        <title>Swag Hunt</title>
        <meta
          property="og:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
        <meta
          name="twitter:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">

        {showAddSwag && <SubmitForm onClose={() => { setShowAddSwag(false) }} />}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <div className="after:content relative mb-5 flex h-[500px] flex-col items-center justify-center gap-4 overflow-hidden rounded-lg bg-white/10 px-6 text-center text-white shadow-highlight after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight lg:pt-0">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="flex max-h-full max-w-full items-center justify-center">
                <Bridge />
              </span>
              <span className="absolute left-0 right-0 bottom-0 h-[400px] bg-gradient-to-b from-black/0 via-black to-black"></span>
            </div>
            <div className='px-5 w-full'>
              <Image
                src="/logo.gif"
                layout="responsive"
                objectFit="contain"
                width="400"
                height="200"
                alt="Swag Hunt Logo"
              />
            </div>
            <input
              className="w-fill z-10 text-black mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm"
              name="search"
              placeholder="  Search for swag"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchQueryChanged}
            />
            <p className="max-w-[40ch] text-white/75 sm:max-w-[32ch] z-10">
              Want to add some swag? <button className="linkButton" onClick={() => setShowAddSwag(true)}>Click Here!</button>
            </p>
          </div>
          {swag.map(({ from, type, url, upvotes }) => (
            <Link
              key={`${from}#${type}`}
              href={`/${from}/${type}`}
              ref={`${from}#${type}` === lastViewedPhoto ? lastViewedPhotoRef : null}
              shallow
              className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
            >
              <Image
                alt={`${toTitleCase(from)} ${toTitleCase(type)}`}
                className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
                style={{ transform: 'translate3d(0, 0, 0)' }}
                src={url}
                width={720}
                height={480}
                sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              />
            </Link>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-white/80 sm:p-12">
        © 2023 Momento. All rights reserved.
      </footer>
    </>
  )
}

export default Home

export async function getServerSideProps() {
  const swagList = await getSwagList({});

  return {
    props: {
      swag: swagList.swag,
      ...swagList.pageToken && { pageToken: swagList.pageToken }
    }
  };
};
