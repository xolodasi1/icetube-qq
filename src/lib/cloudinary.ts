export const uploadVideoToCloudinary = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing (Cloud Name or Upload Preset)');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url); // Returns the URL to the video
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing (Cloud Name or Upload Preset)');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Image upload failed');
  }
  return data.secure_url;
};

export const getOptimizedThumbnail = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/') && !url.includes('/so_')) {
    // Generate a thumbnail from the middle of the video instead of the potentially black first frame
    return url.replace('/video/upload/', '/video/upload/so_auto/');
  }
  return url;
};
