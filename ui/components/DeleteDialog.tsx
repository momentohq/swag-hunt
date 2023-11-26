import React, { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { deleteSwag } from '../services/SwagService';
import { DeleteSwag } from '../utils/types';

export default function DeleteDialog({ showAdmin, swag, url, onClose }: { showAdmin: string, swag: DeleteSwag, url: string, onClose?: () => void }) {
  let overlayRef = useRef();
  const [adminOverride, setAdminOverride] = useState<string>(showAdmin);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await deleteSwag(swag.from, swag.type, url, adminOverride);
    onClose();
  };

  function handleClose() {
    onClose()
  };

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      initialFocus={overlayRef}
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      <Dialog.Title />
      <Dialog.Description />
      <Dialog.Overlay
        ref={overlayRef}
        as={motion.div}
        key="backdrop"
        className="fixed inset-0 z-30 bg-momento-forest-green/80 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <form onSubmit={handleSubmit} className="flex h-fit w-5/6 flex-col justify-end w-2/6 gap-4 overflow-hidden rounded-lg bg-momento-dark-forest px-6 pb-2 text-center text-white shadow-highlight lg:pt-0 z-50">
        <h1 className="text-center text-3xl font-bold mt-4">Delete Swag</h1>
        <hr />
        <p>This will delete the currently selected image permanently. <br/><br/><b>Are you sure?</b><br/><br/>It might take a few seconds to delete, so don't panic.</p>
        <input
          placeholder="Those who know, know..."
          type="password"
          value={adminOverride}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminOverride(e.target.value)}
          className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
        />
        <div className="flex flex-row gap-4 justify-end">
          <button onClick={() => onClose()} className="py-2 px-4 mt-2 text-momento-forest-green bg-white font-semibold rounded-lg shadow-md hover:bg-momento-mint-green focus:outline-none">
            Cancel
          </button>
          <button type="submit" className="py-2 px-4 mt-2 bg-momento-electric-green text-momento-forest-green font-semibold rounded-lg shadow-md hover:bg-momento-mint-green focus:outline-none">
            Delete
          </button>
        </div>
      </form>
    </Dialog>
  );
};
