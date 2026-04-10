const gateway =
  import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";

export const convertToGatewayUrl = (ipfsUri) => {
  return ipfsUri.replace("ipfs://", gateway);
};

export const fetchImageFromMetadata = async (metadataURI) => {
  try {
    const gatewayUrl = convertToGatewayUrl(metadataURI);
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const metadata = await response.json();

    // IMPORTANT: handle both cases
    return metadata.image
      ? convertToGatewayUrl(metadata.image)
      : null;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
};