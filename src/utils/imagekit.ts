const IMAGEKIT_PUBLIC_KEY = "public_4xJrmuozjePE+d6nOK8b0ZWegWw=";
const IMAGEKIT_PRIVATE_KEY = "private_xd0dqMmEyjl/tOb+3PeP5R4Ylag=";
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/eg7u6xcn0u";
const IMAGEKIT_UPLOAD_API = "https://upload.imagekit.io/api/v1/files/upload";

/**
 * Uploads a given file to ImageKit.io
 * @param file The file object from an input element
 * @returns The resulting uploaded file URL
 */
export const uploadToImageKit = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("useUniqueFileName", "true");

  try {
    const response = await fetch(IMAGEKIT_UPLOAD_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(IMAGEKIT_PRIVATE_KEY + ":")}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload image");
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw error;
  }
};
