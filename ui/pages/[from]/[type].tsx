import type { NextPage } from 'next'
import Head from 'next/head'
import Carousel from '../../components/Carousel'
import type { SwagDetail } from '../../utils/types'
import { getSwagDetail } from '../../services/SwagService'
import { toTitleCase } from '../../utils/titleCase'

const DetailPage: NextPage = ({ swag }: { swag: SwagDetail }) => {
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
  )
}

export default DetailPage;

export async function getServerSideProps({ params }) {
  const { from, type } = params;

  const detail: SwagDetail | undefined = await getSwagDetail({ from, type });
  if (!detail) {
    return { notFound: true };
  }

  return {
    props: {
      swag: detail
    }
  }
};
