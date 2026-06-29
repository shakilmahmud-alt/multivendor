const CPANEL_UPLOAD_API = import.meta.env.VITE_UPLOAD_API_URL || "https://media.holidaymartbd.com/api/upload.php";
const MEDIA_API_KEY = import.meta.env.VITE_MEDIA_API_KEY || "HolidayMartMediaSecuredToken2026!";

/**
 * Uploads a given file to the cPanel media server.
 * @param file The file object from an input element
 * @param folder The target folder ('products', 'vendors', 'categories')
 * @returns The resulting uploaded file URL
 */
export const uploadToCpanel = async (
  file: File,
  folder: 'products' | 'vendors' | 'categories' | 'banners'
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const response = await fetch(CPANEL_UPLOAD_API, {
      method: "POST",
      headers: {
        "X-API-Key": MEDIA_API_KEY
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "Failed to upload image";
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Not JSON
        console.error("Non-JSON error from cPanel API:", text);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (result.status === 'error' || result.success === false) {
       throw new Error(result.error || result.message || "Failed to upload image");
    }

    // Assuming the API returns something like { success: true, url: 'https://media.holidaymartbd.com/uploads/products/xyz.jpg' }
    return result.url;
  } catch (error) {
    console.error("cPanel upload error:", error);
    alert("Upload Error: " + (error instanceof Error ? error.message : String(error)));
    throw error;
  }
};
