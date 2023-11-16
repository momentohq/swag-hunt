import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { updateSwag } from '../services/SwagService';
import { UpdateSwag } from '../utils/types';
import { swagTypes } from '../utils/swag';

export default function EditForm({ showAdmin, data, onClose }: { showAdmin: string, data: UpdateSwag, onClose?: () => void }) {
  let overlayRef = useRef();
  const [formData, setFormData] = useState<UpdateSwag>(data);
  const [tags, setTags] = useState<string>(data.tags?.join(', ') ?? '');
  const [adminOverride, setAdminOverride] = useState<string>(showAdmin);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await updateSwag(formData, data.from, data.type, adminOverride);
    onClose();
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTags(event.target.value);
    setFormData({ ...formData, tags: event.target.value?.split(',').map(t => t.trim()).map(t => t) });
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
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
      <form onSubmit={handleSubmit} className="mb-5 flex h-fit flex-col justify-end w-2/6 gap-4 overflow-hidden rounded-lg bg-momento-dark-forest px-6 pb-8 text-center text-white shadow-highlight lg:pt-0 z-50">
        <h1 className="text-center text-3xl font-bold mt-4">Update Swag</h1>
        <hr />
        <input
          placeholder="Those who know, know..."
          type="password"
          value={adminOverride}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminOverride(e.target.value)}
          className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
        />

        <label className="block">
          <span className="block text-left">Swag Photo Url</span>
          <input type="text" disabled={true} value={formData.url} className="block w-full mt-1" />
        </label>

        <label className="block">
          <span className="block text-left">Swag Type</span>
          <select
            name="type"
            required
            value={formData.type}
            onChange={handleSelectChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
          >
            {swagTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-left">Vendor/From</span>
          <input
            type="text"
            name="from"
            required
            value={formData.from}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Was it a vendor?"
          />
        </label>

        <label className="block">
          <span className="block text-left">Found Location</span>
          <input
            type="text"
            name="location"
            required
            value={formData.location}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Be specific"
          />
        </label>

        <label className="block">
          <span className="block text-left">Tags</span>
          <input
            type="text"
            value={tags}
            onChange={handleTagChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Any additional tags"
          />
        </label>

        <button type="submit" className="py-2 px-4 mt-2 bg-momento-electric-green text-momento-forest-green font-semibold rounded-lg shadow-md hover:bg-momento-mint-green focus:outline-none">
          Update
        </button>
      </form>
    </Dialog>
  );
};
