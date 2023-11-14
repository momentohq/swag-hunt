import { NewSwag, NewSwagResponse, SwagDetail, SwagList, UploadDetails } from "../utils/types";

const SwagAPI: string = process.env.NEXT_PUBLIC_BASE_URL;

interface UploadPhotoParams {
  photo: File
  referenceNumber?: string
  adminOverride?: string
}

export const uploadPhoto = async ({ photo, referenceNumber, adminOverride }: UploadPhotoParams): Promise<string> => {
  try {
    const fileName = encodeURIComponent(photo.name);

    const queryParams = new URLSearchParams({ fileName });
    if (referenceNumber) {
      queryParams.append('referenceNumber', referenceNumber);
    }

    if(adminOverride){
      queryParams.append('adminOverride', adminOverride);
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
    console.log(swagList)
    return swagList;
  } catch (err) {
    console.error(err);
    return { swag: [] };
  }
}

export const saveSwag = async (swag: NewSwag): Promise<NewSwagResponse> => {
  try {
    const response: Response = await fetch(`${SwagAPI}/swag`, {
      method: 'POST',
      body: JSON.stringify(swag)
    });

    return await response.json() as NewSwagResponse;
  } catch (err) {
    console.error(err);
    return { message: 'Something went wrong submitting your swag. Please try again.' };
  }
}

export const swagSearch = async (query: string): Promise<SwagList> => {
  try {
    const response: Response = await fetch(`${SwagAPI}/swag/search`, {
      method: 'POST',
      body: JSON.stringify({query})
    });

    return await response.json() as SwagList;
  } catch (err) {
    console.error(err);
    return { swag: [] };
  }
}
