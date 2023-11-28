import { useState } from "react";
import Image from 'next/image';
import { upvote } from "../services/SwagService";
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import Twitter from './Icons/Twitter'

interface ActionBarProps {
  from: string
  type: string
  upvotes: number
  closeModal: () => void
}

export default function ImageActionBar({ from, type, upvotes, closeModal }: ActionBarProps) {
  const key = `${from}#${type}#upvote`;
  const [upvoteCount, setUpvoteCount] = useState<Number>(upvotes);

  const twitterMessage = `Check out this swag I found at re:Invent on @momentohq #swaghunt!

  #reinvent #swag
  https://swaghunt.io/${encodeURIComponent(from)}/${encodeURIComponent(type)}/`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`;

  const upvoteImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const didUpvote = localStorage?.getItem(key);
    if (!didUpvote) {
      const newCount: Number = await upvote(from, type, upvoteCount);
      setUpvoteCount(newCount);
      localStorage?.setItem(key, 'true');
    }
  }

  return (
    <div className="flex flex-row justify-between h-fit w-full bg-momento-electric-green z-50 px-2 rounded-bl rounded-br">
      <div className="w-fit flex align-center h-fit">
        <button
          onClick={() => closeModal()}
          className="p-2 text-momento-forest-green backdrop-blur-lg transition hover:bg-momento-mint-green"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
        <button
          id="upvotebtn"
          className="p-2 text-momento-forest-green backdrop-blur-lg transition hover:bg-momento-mint-green"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => upvoteImage(e)}
        >
          <div className="flex flex-row gap-1 justify-center items-center">
            <Image alt="upvote" src="/arrow.svg" width="12" height="12" className="ml-1" />
            <div className="text-black rounded pr-2 ">
              {upvoteCount?.toString()}
            </div>
          </div>
        </button>
      </div>
      <div className="flex flex-row gap-1 justify-center align-center w-fit">
        <a
          href={twitterUrl}
          className="p-2 text-momento-forest-green backdrop-blur-lg transition hover:bg-momento-mint-green"
          target="_blank"
          title="Open fullsize version"
          rel="noreferrer"
        >
          <div className="flex flex-row gap-2 items-center">
            <span className="font-semibold">Share</span>
            <Twitter className="h-5 w-5" />
          </div>
        </a>

      </div>

    </div>
  )
};
