import React from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Carousel from '../../components/Carousel';
import type { SwagDetail } from '../../utils/types';
import { getSwagDetail } from '../../services/SwagService';
import { toTitleCase } from '../../utils/titleCase';
import { useRouter } from 'next/router';

const DetailPage: NextPage = ({ swag }: { swag: SwagDetail }) => {
  const router = useRouter();
  const { admin } = router.query;

  if (!swag) {
    router.push(`/${admin ? '?admin=' + admin : ''}`);
  }

  return (
    <>
      <Head>
        <title>{`${toTitleCase(swag?.from)} ${toTitleCase(swag?.type)} | Swag Hunt`}</title>
        <meta property="og:image" content={swag?.url} />
        <meta name="twitter:image" content={swag?.url} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel swag={swag} admin={admin?.toString()} />
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { from, type } = context.query;

  let swag = null;
  if (from && type) {
    try {
      swag = await getSwagDetail({ from: from as string, type: type as string });
    } catch (error) {
      console.error('Failed to fetch swag details:', error);
    }
  }

  return {
    props: { swag },
  };
};

export default DetailPage;
