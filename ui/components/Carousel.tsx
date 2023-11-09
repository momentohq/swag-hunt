import Image from 'next/image'
import { useRouter } from 'next/router'
import useKeypress from 'react-use-keypress'
import type { SwagDetail } from '../utils/types'
import SharedModal from './SharedModal'

export default function Carousel({ swag }: { swag: SwagDetail }) {
  const router = useRouter()
  let currentPhoto = swag.url;

  function closeModal() {
    router.push('/', undefined, { shallow: true })
  }

  function changePhoto(newUrl: string) {
    currentPhoto = newUrl;
  }

  useKeypress('Escape', () => {
    closeModal()
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <button
        className="absolute inset-0 z-30 cursor-default bg-black backdrop-blur-2xl"
        onClick={closeModal}
      >
        <Image
          src={currentPhoto}
          className="pointer-events-none h-full w-full"
          alt="blurred background"
          fill
          priority={true}
        />
      </button>
      <SharedModal
        from={swag.from}
        type={swag.type}
        mainImage={swag.url}
        images={swag.additionalImages}
        currentPhoto={currentPhoto}
        changePhoto={changePhoto}
        closeModal={closeModal}
      />
    </div>
  )
}
