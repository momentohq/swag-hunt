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
  const [upvoteCount, setUpvoteCount] = useState<Number>(upvotes);

  const upvoteImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount: Number = await upvote(from, type, upvoteCount);
    setUpvoteCount(newCount);
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
          href={`https://twitter.com/intent/tweet?text=Check%20out%20this%20swag%20I%20found%20at%20re:Invent%20on%20%40gomomento%20%23swaghunt!%0A%23reinvent%20%23swag%0A%0Ahttps://swaghunt.io/${from}/${type}`}
          className="p-2 text-momento-forest-green backdrop-blur-lg transition hover:bg-momento-mint-green"
          target="_blank"
          title="Open fullsize version"
          rel="noreferrer"
        >
          <Twitter className="h-5 w-5" />
        </a>

      </div>

    </div>
  )
};
