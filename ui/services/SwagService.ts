import { UploadDetails } from "../utils/types";

const SwagAPI: string = process.env.NEXT_PUBLIC_BASE_URL;

interface UploadPhotoParams {
  photo: File;
  referenceNumber?: string;
}

export const uploadPhoto = async ({ photo, referenceNumber }: UploadPhotoParams): Promise<string> => {
  try {
    const fileName = encodeURIComponent(photo.name);

    const queryParams = new URLSearchParams({ fileName });
    if (referenceNumber) {
      queryParams.append('referenceNumber', referenceNumber);
    }

    const response: Response = await fetch(`${SwagAPI}/swag/uploads?${queryParams.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Failed to get upload url');
    }

    const uploadDetails: UploadDetails = await response.json();
    const { presignedUrl, referenceNumber: returnedReferenceNumber } = uploadDetails;

    // If referenceNumber was not passed in, use the one returned from the API
    const finalReferenceNumber = referenceNumber || returnedReferenceNumber;

    const uploadResponse: Response = await fetch(presignedUrl, {
      method: 'PUT',
      body: photo,
      headers: {
        'Content-Type': photo.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo');
    }

    return finalReferenceNumber;

  } catch (error) {
    console.error('uploadPhoto error:', error);
    throw error;
  }
};
