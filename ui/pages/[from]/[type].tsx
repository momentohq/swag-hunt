import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Carousel from '../../components/Carousel';
import type { SwagDetail } from '../../utils/types';
import { getSwagDetail } from '../../services/SwagService';
import { toTitleCase } from '../../utils/titleCase';
import { useRouter } from 'next/router';
import { Puff } from 'react-loading-icons';

const DetailPage: NextPage = () => {
  const [swag, setSwag] = useState<SwagDetail | null>(null);
  const router = useRouter();
  const { from, type } = router.query;

  useEffect(() => {
    const fetchSwagDetail = async () => {
      if (from && type) {
        try {
          const detail = await getSwagDetail({ from: from as string, type: type as string });
          if (detail) {
            setSwag(detail);
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Failed to fetch swag details:', error);
          router.push('/');
        }
      }
    };

    fetchSwagDetail();
  }, [from, type, router]);

  if (!swag) {

    return (
      <>
        <Head>
          <title>Swag | Swag Hunt</title>
        </Head>
        <main className="flex h-screen items-center justify-center p-4">
          <Puff className="w-64 h-64" /> 
        </main>
      </>
    );

  }

  return (
    <>
      <Head>
        <title>{`${toTitleCase(swag.from)} ${toTitleCase(swag.type)} | Swag Hunt`}</title>
        <meta property="og:image" content={swag.url} />
        <meta name="twitter:image" content={swag.url} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel swag={swag} />
      </main>
    </>
  );
};

export default DetailPage;
