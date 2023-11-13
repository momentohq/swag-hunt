/* eslint-disable no-unused-vars */
export interface SharedModalProps {
  from: string
  type: string
  mainImage: string
  images?: string[]
  currentPhoto?: string
  changePhoto: (url: string) => void
  closeModal: () => void
  direction?: number
}

export interface SwagSummary {
  from: string,
  type: string,
  url: string,
  upvotes?: number
}

export interface SwagList {
  swag: SwagSummary[],
  pageToken?: string
}

export interface UploadDetails {
  referenceNumber: string,
  presignedUrl: string
}

export interface SwagDetail {
  from: string,
  type: string,
  url: string,
  upvotes: number,
  location: string,
  additionalImages: string[]
}

export interface NewSwag {
  from: string
  referenceNumber: string
  location?: string
  tags?: string[]
  email?: string
}

export interface NewSwagResponse {
  from?: string
  type?: string
  message?: string
}
