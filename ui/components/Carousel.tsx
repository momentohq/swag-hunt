import React, { useState } from 'react';
import { useRouter } from 'next/router'
import useKeypress from 'react-use-keypress'
import type { SwagDetail } from '../utils/types'
import SharedModal from './SharedModal'
import { toTitleCase } from '../utils/titleCase';

export default function Carousel({ swag }: { swag: SwagDetail }) {
  const router = useRouter()
  const [currentPhoto, setCurrentPhoto] = useState<string>(swag.url);

  function closeModal() {
    router.push('/', undefined, { shallow: true })
  }

  function changePhoto(newUrl: string) {
    setCurrentPhoto(newUrl);
  }

  useKeypress('Escape', () => {
    closeModal()
  })

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center">
      <button
        className="absolute inset-0 z-30 cursor-default bg-black backdrop-blur-2xl text-white"
        onClick={closeModal}
      />
      <div className="text-white z-50 mb-4 text-center">
        <p className="text-2xl">{`${toTitleCase(swag.from)} ${toTitleCase(swag.type)}`}</p>
        {swag.location && <p className="text-xl mt-1">Found at {swag.location}</p>}
      </div>
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
