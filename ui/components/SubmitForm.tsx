import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Dialog } from '@headlessui/react'
import { swagTypes } from '../utils/swag';
import { uploadPhoto } from '../services/SwagService';

interface FormData {
  image: File | null;
  vendor: string;
  location: string;
  tags: string[];
  email: string;
  swagType: string;
}

export default function SubmitForm({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  let overlayRef = useRef()
  const [formData, setFormData] = useState<FormData>({
    image: null,
    vendor: '',
    location: '',
    tags: [],
    email: '',
    swagType: 'other'
  });
  const [refNumber, setRefNumber] = useState<string>();
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form data submitted:', formData, 'Reference number:', refNumber);
    // Submit form data to the server or handle it as needed
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFormData({ ...formData, image: event.target.files[0] });
      uploadPhoto({ photo: event.target.files[0], referenceNumber: refNumber });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleTagAddition = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && tagInputRef.current) {
      const newTag = tagInputRef.current.value;
      if (newTag) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
        tagInputRef.current.value = '';
      }
    }
  };

  function handleClose() {
    router.push('/', undefined, { shallow: true })
    onClose()
  }

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      initialFocus={overlayRef}
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      <Dialog.Overlay
        ref={overlayRef}
        as={motion.div}
        key="backdrop"
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <form onSubmit={handleSubmit} className="mb-5 flex h-fit flex-col justify-end gap-4 overflow-hidden rounded-lg bg-white/10 px-6 pb-8 text-center text-white shadow-highlight lg:pt-0 z-50">
        <h1 className="text-center text-3xl font-bold mt-4">Found some swag?</h1>
        <hr />
        <label className="block">
          <span className="block text-left">Swag Photo</span>
          <input type="file" onChange={handleImageChange} className="block w-full mt-1" />
        </label>

        <label className="block">
          <span className="block text-left">Who gave this to you?</span>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Was it a vendor?"
          />
        </label>

        <label className="block">
          <span className="block text-left">Where did you get it?</span>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Be specific"
          />
        </label>

        <label className="block">
          <span className="block text-left">Type</span>
          <select
            name="swagType"
            required
            value={formData.swagType}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
          >
            {swagTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-left">Tags</span>
          <input
            type="text"
            ref={tagInputRef}
            onKeyDown={handleTagAddition}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="Enter tags and press Enter"
          />
          <div className="mt-3">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-block bg-momento-light-mint text-black text-xs font-semibold mr-2 px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="block text-left">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            placeholder="(Optional) Enter for a raffle entry"
          />
        </label>

        <button type="submit" className="py-2 px-4 mt-2 bg-momento-mint-green text-black font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none">
          Submit
        </button>
      </form>
    </Dialog>
  );
};
