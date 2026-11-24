const getImageUrl = (url) => {
  return `${import.meta.env.VITE_IMG_URL}${url}`;
};

export { getImageUrl };
