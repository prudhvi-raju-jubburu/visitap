/**
 * Appends Cloudinary transformation parameters to a given URL if it's a Cloudinary URL.
 * Defaults to automatic format (f_auto) and quality (q_auto).
 */
export const transformCloudinaryUrl = (url, transformations = 'f_auto,q_auto') => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Replace '/upload/' with '/upload/<transformations>/'
  // and handle already existing transformations
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    if (parts[1].startsWith('v') || parts[1].includes('/')) {
        // v123456789/... or some_path/...
        return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
  }
  
  return url;
};
