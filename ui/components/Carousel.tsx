import React, { useState } from 'react';
import { useRouter } from 'next/router'
import useKeypress from 'react-use-keypress'
import type { SwagDetail } from '../utils/types'
import SharedModal from './SharedModal'
import { toTitleCase } from '../utils/titleCase';
import EditForm from './EditForm';
import { PencilIcon } from '@heroicons/react/24/outline'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import Twitter from './Icons/Twitter'
import { upvote } from '../services/SwagService'
import downloadPhoto from '../utils/downloadPhoto'

export default function Carousel({ swag, admin }: { swag: SwagDetail, admin?: string }) {
  const router = useRouter()
  const [currentPhoto, setCurrentPhoto] = useState<string>(swag.url);
  const [showEditForm, setShowEditForm] = useState<Boolean>(false);

  const [upvoteCount, setUpvoteCount] = useState<Number>(swag.upvotes);

  const upvoteImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount: Number = await upvote(swag.from, swag.type, upvoteCount);
    setUpvoteCount(newCount);
  }
  function closeModal() {
    router.back();
  }

  function changePhoto(newUrl: string) {
    setCurrentPhoto(newUrl);
  }

  useKeypress('Escape', () => {
    closeModal()
  })

  return (
    <div className="fixed inset-0 flex flex-col items-center pt-4 lg:justify-center lg:pt-0">
      <button
        className="absolute inset-0 z-30 cursor-default bg-momento-forest-green opacity-80 backdrop-blur-2xl text-white"
        onClick={closeModal}
      />
      <div className="flex flex-row items-center justify-center gap-6 mb-4">
        <div className="text-white z-50 text-center">
          <p className="text-2xl" style={{ fontFamily: 'Manrope', fontWeight: 800 }}>{`${toTitleCase(swag.type)} from ${toTitleCase(swag.from)}`}</p>
          {swag.location && <p className="text-xl mt-1">Found at {swag.location}</p>}
        </div>
        {admin && (
          <button
            onClick={() => setShowEditForm(true)}
            className="rounded-full z-50 bg-momento-electric-green p-2 text-momento-forest-green backdrop-blur-lg transition hover:bg-momento-mint-green"
            title="Download fullsize version"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {showEditForm && (
        <EditForm showAdmin={admin} data={swag} onClose={() => setShowEditForm(false)} />
      )}
      <SharedModal
        from={swag.from}
        type={swag.type}
        mainImage={swag.url}
        images={swag.additionalImages}
        currentPhoto={currentPhoto}
        changePhoto={changePhoto}
        closeModal={closeModal}
        upvotes={swag.upvotes}
      />
    </div>
  )
}
