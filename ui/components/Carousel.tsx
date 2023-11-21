import React, { useState } from 'react';
import { useRouter } from 'next/router'
import useKeypress from 'react-use-keypress'
import type { SwagDetail } from '../utils/types'
import SharedModal from './SharedModal'
import { toTitleCase } from '../utils/titleCase';
import EditForm from './EditForm';
import DeleteDialog from './DeleteDialog';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

import ImageActionBar from './ImageActionBar';

export default function Carousel({ swag, admin }: { swag: SwagDetail, admin?: string }) {
  const router = useRouter()
  const [currentPhoto, setCurrentPhoto] = useState<string>(swag.url);
  const [showEditForm, setShowEditForm] = useState<Boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Boolean>(false);
  function closeModal() {
    router.push(`/${admin ? '?admin=' + admin : ''}`);
  }

  function changePhoto(newUrl: string) {
    setCurrentPhoto(newUrl);
  }

  useKeypress('Escape', () => {
    closeModal()
  })

  return (
    <div className="fixed inset-0 flex flex-col items-center pt-4 px-4">
      <button
        className="absolute inset-0 z-30 cursor-default bg-momento-forest-green opacity-80 backdrop-blur-2xl text-white"
        onClick={closeModal}
      />
      <div className="flex flex-col w-full lg:w-5/6 mb-4">
        <div className="flex flex-row z-50 items-center justify-center p-4  bg-white rounded-tl rounded-tr">
          <div className="text-gray-800 text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>{`${toTitleCase(swag.type)} from ${toTitleCase(swag.from)}`}</p>
            {swag.location && <p className="text-xl mt-1">Found at {swag.location}</p>}
          </div>
          {admin && (
            <div className="flex flex-row gap-2 ml-12">
              <button
                onClick={() => setShowEditForm(true)}
                className="rounded-full bg-momento-electric-green p-2 text-momento-forest-green backdrop-blur-lg transition duration-300 ease-in-out hover:bg-momento-mint-green"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-full bg-momento-electric-green p-2 text-momento-forest-green backdrop-blur-lg transition duration-300 ease-in-out hover:bg-momento-mint-green"
                title="Edit"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        <ImageActionBar from={swag.from} type={swag.type} upvotes={swag.upvotes} closeModal={closeModal} />
      </div>
      <SharedModal
        mainImage={swag.url}
        images={swag.additionalImages}
        currentPhoto={currentPhoto}
        changePhoto={changePhoto}
      />
      {showEditForm && (
        <EditForm showAdmin={admin} data={swag} onClose={() => setShowEditForm(false)} />
      )}
      {showDeleteDialog && (
        <DeleteDialog showAdmin={admin} swag={swag} onClose={() => setShowDeleteDialog(false)} />
      )}
    </div>
  )
}
