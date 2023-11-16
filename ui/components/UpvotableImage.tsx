import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { upvote } from '../services/SwagService';
import { toTitleCase } from '../utils/titleCase';

// Define the props types
interface UpvotableImageProps {
  from: string;
  type: string;
  url: string;
  upvotes?: number;
  admin?: string
}

const UpvotableImage: React.FC<UpvotableImageProps> = ({ from, type, url, upvotes, admin }) => {
  const [upvoteCount, setUpvoteCount] = useState<Number>(upvotes);

  const upvoteImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount: Number = await upvote(from, type, upvoteCount);
    setUpvoteCount(newCount);
  }

  return (
    <div className="relative mb-5 block w-full">
      <Link
        key={`${from}#${type}`}
        href={`/${from}/${type}${admin ? '?admin=' + admin : ''}`}
        shallow
        className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
      >
        <Image
          alt={`${toTitleCase(from)} ${toTitleCase(type)}`}
          className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
          style={{ transform: 'translate3d(0, 0, 0)' }}
          src={url}
          width={720}
          height={480}
          sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
        />
        <button
          className="absolute top-2 left-2 bg-white bg-opacity-50 rounded-full p-1 text-momento-forest-green hover:bg-opacity-70 focus:outline-none"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => upvoteImage(e)}
        >
          <div className="flex flex-row gap-1 justify-center items-center">
            <Image alt="upvote" src="/arrow.svg" width="12" height="12" className="ml-1" />
            <div className="text-black rounded pr-2 ">
              {upvoteCount?.toString()}
            </div>
          </div>
        </button>
      </Link>
    </div >
  );
};

export default UpvotableImage;
