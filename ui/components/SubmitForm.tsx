import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Dialog } from '@headlessui/react'
import short from 'short-uuid';
import { swagTypes } from '../utils/swag';

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
  const [refNumber, setRefNumber] = useState<string>(short.generate());
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form data submitted:', formData, 'Reference number:', refNumber);
    // Submit form data to the server or handle it as needed
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFormData({ ...formData, image: event.target.files[0] });
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
      <form onSubmit={handleSubmit} className="flex flex-col p-4 space-y-6 bg-white shadow-md rounded-lg z-50">
        <label className="block">
          <span className="text-gray-700">Image</span>
          <input type="file" onChange={handleImageChange} className="block w-full mt-1" />
        </label>

        <label className="block">
          <span className="text-gray-700">Who gave this to you?</span>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Was it a vendor?"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Where did you get it?</span>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Be specific"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Type</span>
          <select
            name="swagType"
            required
            value={formData.swagType}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
            {swagTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-gray-700">Tags</span>
          <input
            type="text"
            ref={tagInputRef}
            onKeyDown={handleTagAddition}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Enter tags and press Enter"
          />
          <div className="mt-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="(Optional) Enter for a raffle entry"
          />
        </label>

        <button type="submit" className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none">
          Submit
        </button>
      </form>
    </Dialog>
  );
};
