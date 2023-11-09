/* eslint-disable no-unused-vars */
export interface ImageProps {
  id: number
  height: string
  width: string
  public_id: string
  format: string
  blurDataUrl?: string
}

export interface SharedModalProps {
  index: number
  images?: SwagSummary[]
  currentPhoto?: ImageProps
  changePhotoId: (newVal: number) => void
  closeModal: () => void
  navigation: boolean
  direction?: number
}

export interface SwagSummary {
  from: string,
  type: string,
  url: string,
  upvotes: number
}

export interface SwagList {
  swag: SwagSummary[]
}

export interface UploadDetails {
  referenceNumber: string,
  presignedUrl: string
}
