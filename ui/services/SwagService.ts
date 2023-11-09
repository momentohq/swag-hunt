import { SwagDetail, SwagList, UploadDetails } from "../utils/types";

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

    const response: Response = await fetch(`${SwagAPI}/swag/uploads?${queryParams.toString()}`, { method: 'GET' });
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

interface GetSwagDetailParams {
  from: string,
  type: string
};

export const getSwagDetail = async ({ from, type }: GetSwagDetailParams): Promise<SwagDetail | undefined> => {
  try {
    const response: Response = await fetch(`${SwagAPI}/swag/${from}/${type}`, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to get swag detail');
    }

    const swagDetail: SwagDetail = await response.json();
    return swagDetail;

  } catch (err) {
    console.error(err);
    return undefined;
  }
};

interface GetSwagListParams {
  pageToken?: string
}

export const getSwagList = async ({ pageToken }: GetSwagListParams): Promise<SwagList> => {
  try {
    const queryParams = new URLSearchParams();
    if (pageToken) {
      queryParams.append('pageToken', pageToken)
    }

    const response: Response = await fetch(`${SwagAPI}/swag?${queryParams.toString()}`, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to fetch swag list');
    }

    const swagList: SwagList = await response.json();
    return swagList;
  } catch (err) {
    console.error(err);
    return { swag: [], pageToken: undefined };
  }
}
