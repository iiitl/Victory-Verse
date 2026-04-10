const DEFAULT_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";

export const convertToGatewayUrl = (ipfsUri) => {
  if (!ipfsUri) return null;
  return ipfsUri.replace("ipfs://", DEFAULT_GATEWAY);
};

export const fetchImageFromMetadata = async (metadataURI, options = {}) => {
  try {
    const gatewayUrl = convertToGatewayUrl(metadataURI);
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const metadata = await response.json();

    if (!metadata.image) return null;

    return options.convertImage
      ? convertToGatewayUrl(metadata.image)
      : metadata.image; 
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
};