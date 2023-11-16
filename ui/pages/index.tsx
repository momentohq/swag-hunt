import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import SubmitForm from '../components/SubmitForm'
import type { SwagSummary } from '../utils/types'
import { useLastViewedPhoto } from '../utils/useLastViewedPhoto'
import { getSwagList, swagSearch } from '../services/SwagService'
import { toTitleCase } from '../utils/titleCase'
import UpvotableImage from '../components/UpvotableImage'

const Home: NextPage = () => {
  const router = useRouter();

  const { photoId, admin } = router.query;
  const [swag, setSwag] = useState<SwagSummary[]>([]);
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();
  const [showAddSwag, setShowAddSwag] = useState<Boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const fetchSwagList = async () => {
      try {
        const swagList = await getSwagList({});
        setSwag(swagList.swag);
      } catch (error) {
        console.error('Failed to fetch swag list:', error);
      }
    };

    fetchSwagList();
  }, []);

  useEffect(() => {
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: 'center' })
      setLastViewedPhoto(null)
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto])

  const handleSearchQueryChanged = async (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setSearchQuery('');
      const results = await swagSearch(searchQuery);
      setSwag(results.swag);
    }
  }

  return (
    <>
      <Head>
        <title>Swag Hunt</title>
        <meta property="og:image" content="/ogSwaghunt.png" />
        <meta name="twitter:image" content="/ogSwaghunt.png" />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">

        {showAddSwag && <SubmitForm showAdmin={admin?.toString()} onClose={() => { setShowAddSwag(false) }} />}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <div className="mainTile after:content relative mb-5 flex h-[500px] flex-col items-center justify-center gap-4 overflow-hidden rounded-lg bg-momento-forest-green px-6 text-center text-white shadow-highlight after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight lg:pt-0">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
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
              className="w-fill z-10 text-black mt-1 block w-full rounded-sm p-1 shadow-sm focus:border-momento-mint-green"
              name="search"
              placeholder="  Search for swag"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchQueryChanged}
            />
            <p className="max-w-[40ch] text-white/75 sm:max-w-[32ch] z-10">
              Want to add some swag? <button className="linkButton text-momento-mint-green hover:text-momento-dark-mint" onClick={() => setShowAddSwag(true)}>Click Here!</button>
            </p>
          </div>
          {swag.map(({ from, type, url, upvotes }) => (
            <UpvotableImage from={from} type={type} url={url} upvotes={upvotes}/>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-white/80 sm:p-12">
        © 2023 Momento. All rights reserved.
      </footer>
    </>
  )
}

export default Home;
