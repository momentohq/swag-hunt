import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Image from 'next/image'
import { useSwipeable } from 'react-swipeable'
import { variants } from '../utils/animationVariants'
import type { SharedModalProps } from '../utils/types'
import { useContext, useEffect, useState } from 'react'
import CacheContext from '../services/CacheContext'
import { CacheGet } from '@gomomento/sdk-web';


export default function SharedModal({ mainImage, images, currentPhoto, changePhoto, direction }: SharedModalProps) {
  const { cacheClient, refreshSDK } = useContext(CacheContext);
  const navigation = images.length > 0;
  let swagImages = [mainImage, ...images];
  const [imgSource, setImgSource] = useState<string>(currentPhoto);

  let index = 0;

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (index < swagImages?.length - 1) {
        changePhoto(swagImages[index + 1])
      }
    },
    onSwipedRight: () => {
      if (index > 0) {
        changePhoto(swagImages[index - 1])
      }
    },
    trackMouse: true,
  });

  useEffect(() => {
    loadDataFromCache();
  }, [currentPhoto]);

  const loadDataFromCache = async () => {
    if (cacheClient) {
      const cacheKey = `public/${currentPhoto.split('/').pop()}`;
      console.log(cacheKey);
      const response = await cacheClient.get(process.env.NEXT_PUBLIC_CACHE_NAME, cacheKey);
      if (response instanceof CacheGet.Hit) {
        const data = Buffer.from(response.valueUint8Array()).toString('base64');
        setImgSource(`data:image/webp;base64, ${data}`);
        console.log('cache');
      } else {
        setImgSource(currentPhoto);
        if (response instanceof CacheGet.Error && response.errorCode() == 'AUTHENTICATION_ERROR') {
          refreshSDK();
        }
        console.log('internet');
      }
    }
  }

  return (
    <MotionConfig
      transition={{
        x: { type: 'spring', stiffness: 100, damping: 20 },
        opacity: { duration: 0.2 },
      }}
    >
      <div
        className="relative z-50 flex h-3/6 w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto"
        {...handlers}
      >
        <div className="w-full overflow-hidden h-full">
          <div className="relative flex h-full lg:aspect-[3/2] items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentPhoto}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative w-full h-full"
              >
                <Image
                  src={imgSource}
                  layout="fill"
                  objectFit="contain"
                  priority
                  alt="Conference Swag"
                  blurDataURL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center">
          {navigation && (
            <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-gradient-to-b from-black/0 to-black/60">
              <motion.div
                initial={false}
                className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14"
              >
                <AnimatePresence initial={false}>
                  {swagImages.map((url) => (
                    <motion.button
                      initial={{
                        width: '0%',
                        x: `${Math.max((index - 1) * -100, 15 * -100)}%`,
                      }}
                      animate={{
                        scale: url === currentPhoto ? 1.25 : 1,
                        width: '100%',
                        x: `${Math.max(index * -100, 15 * -100)}%`,
                      }}
                      exit={{ width: '0%' }}
                      onClick={() => changePhoto(url)}
                      key={url}
                      className={`${url === currentPhoto
                        ? 'z-20 rounded-md shadow shadow-black/50'
                        : 'z-10'
                        } ${swagImages.indexOf(url) === 0 ? 'rounded-l-md' : ''} ${swagImages.indexOf(url) === swagImages.length - 1 ? 'rounded-r-md' : ''
                        } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                    >
                      <Image
                        alt="small photos on the bottom"
                        width={180}
                        height={120}
                        className={`${url === currentPhoto
                          ? 'brightness-110 hover:brightness-110'
                          : 'brightness-50 contrast-125 hover:brightness-75'
                          } h-full transform object-cover transition`}
                        src={url}
                      />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
