import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { saveSwag, uploadPhoto } from '../services/SwagService';
import { TopicClient, CredentialProvider, Configurations, TopicSubscribe, TopicItem } from '@gomomento/sdk-web';
import { TailSpin } from 'react-loading-icons';
import { NewSwag, NewSwagResponse } from '../utils/types';
import { swagTypes } from '../utils/swag';
import { XMarkIcon } from '@heroicons/react/24/outline'

interface FormData {
  image: File | null
  from: string
  location: string
  email: string
  swagType?: string
}

interface Token {
  token: string
  exp: string
}

interface Message {
  result: string
  type?: string
  message?: string
}

export default function SubmitForm({ showAdmin, onClose }: { showAdmin?: string, onClose?: (string?) => void }) {
  let overlayRef = useRef();
  const [formData, setFormData] = useState<FormData>({
    image: null,
    from: '',
    location: '',
    email: '',
    swagType: showAdmin ? 'shirt' : null
  });

  const [refNumber, setRefNumber] = useState<string>();
  const [subscription, setSubscription] = useState<TopicSubscribe.Subscription>();
  const [isProcessing, setIsProcessing] = useState<Boolean>(false);
  const [imageError, setImageError] = useState<string>();
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>();
  const [adminOverride, setAdminOverride] = useState<string>(showAdmin);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const newSwag: NewSwag = {
      referenceNumber: refNumber,
      from: formData.from,
      ...formData.location && { location: formData.location },
      ...formData.email && { email: formData.email },
      ...formData.swagType && { type: formData.swagType }
    };

    const response: NewSwagResponse = await saveSwag(newSwag);
    if (response.message) {
      setSubmitError(response.message);
    } else {
      onClose('Thanks for the swag!');
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target?.files?.length) {
      const file = event.target.files[0];
      updateFormData({ ...formData, image: file });
      startImageProcessing(file);
    }
  };

  const startImageProcessing = async (file: File) => {
    setIsProcessing(true);
    setImageError('');
    try {
      const photoReferenceNumber: string = await uploadPhoto({ photo: file, referenceNumber: refNumber, adminOverride });
      if (photoReferenceNumber != refNumber) {
        setRefNumber(photoReferenceNumber);
        const response: Response = await fetch(`/api/tokens?referenceNumber=${photoReferenceNumber}`);
        if (response.ok) {
          const token: Token = await response.json();
          const topicClient = new TopicClient({
            configuration: Configurations.Browser.latest(),
            credentialProvider: CredentialProvider.fromString({ authToken: token.token })
          });
          const subscribeResponse: TopicSubscribe.Response = await topicClient.subscribe(process.env.NEXT_PUBLIC_CACHE_NAME, photoReferenceNumber, {
            onItem: (item: TopicItem) => processTopicItem(item),
            onError: (error) => console.error(error)
          });
          if (subscribeResponse instanceof TopicSubscribe.Subscription) {
            setSubscription(subscribeResponse);
          } else if (subscribeResponse instanceof TopicSubscribe.Error) {
            console.error(subscribeResponse.errorCode(), subscribeResponse.message())
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const processTopicItem = async (item: TopicItem) => {
    const decodedMessage = Buffer.from(item.valueString(), 'base64').toString('utf-8');
    try {
      const message: Message = JSON.parse(decodedMessage);
      if (message.result == 'Succeeded') {
        setCanSubmit(true)
      } else {
        updateFormData({ ...formDataRef.current, image: null });
        setCanSubmit(false);
        setImageError(message.message);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const updateFormData = (newFormData: FormData) => {
    formDataRef.current = newFormData;
    setFormData(newFormData);
  }

  function handleClose() {
    onClose()
  };

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      initialFocus={overlayRef}
      className="fixed inset-0 z-10 flex p-4 lg:p-0 lg:items-center justify-center"
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
      <form onSubmit={handleSubmit} className="mb-5 flex h-fit w-full px-4 lg:w-fit flex-col justify-start overflow-hidden rounded-lg bg-momento-dark-forest px-6 pb-8 text-center text-white shadow-highlight lg:pt-0 z-50">
        <div className="flex flex-row justify-end mt-2" style={{marginRight: "-14px", cursor: "pointer"}} onClick={onClose}>
          <XMarkIcon height={24} />
        </div>
        <h1 className="text-center text-3xl font-bold mt-0 mb-4">Found some swag?</h1>
        <hr />
        {showAdmin && (<input
          placeholder="Those who know, know..."
          type="password"
          value={adminOverride}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminOverride(e.target.value)}
          className="mt-4 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
        />
        )}
        <label className="block mt-4">
          <span className="block text-left">Swag Photo</span>
          <input type="file" ref={fileInputRef} accept=".png, .jpg, .jpeg, .heic" onChange={handleImageChange} className="block w-full mt-1" />
          {imageError && <p className="text-red-500 text-sm mt-2">{imageError}</p>}
        </label>

        {showAdmin && (
          <label className="block mt-4">
            <span className="block text-left">Type</span>
            <select
              name="swagType"
              required
              value={formData.swagType}
              onChange={handleSelectChange}
              className="mt-1 block w-full rounded-sm p-1 border-gray-300 shadow-sm text-black"
            >
              {swagTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}

        <label className="block mt-4">
          <span className="block text-left">Who gave this to you?</span>
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

        <label className="block mt-4">
          <span className="block text-left">Where did you get it?</span>
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

        <label className="block mt-4">
          <span className="block text-left">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-sm p-1 shadow-sm text-black"
            placeholder="(Optional) Enter for a raffle entry"
          />
        </label>

        <button disabled={!canSubmit} type="submit" className="py-2 px-4 mt-6 bg-momento-electric-green text-momento-forest-green font-semibold rounded-3xl shadow-md hover:bg-momento-mint-green focus:outline-none">
          {isProcessing ? (
            <>
              <div className="flex justify-center items-center gap-1">
                <TailSpin stroke="#000" className="h-5" />
                <span>Processing</span>
              </div>
            </>
          ) : (
            <span>Submit</span>
          )
          }
        </button>
        {submitError && <p className="text-red-500 text-sm mt-2">{submitError}</p>}

      </form>
    </Dialog>
  );
};
