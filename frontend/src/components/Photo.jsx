function Photo({ photo, className = "" }) {
  return (
    <img
      src={photo.src}
      alt={photo.alt}
      className={`photo-frame rounded-4 shadow-sm ${className}`}
    />
  );
}

export default Photo;
