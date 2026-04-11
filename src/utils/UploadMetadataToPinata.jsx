// utils/UploadMetadataToPinata.js

/**
 * Upload a JSON object to Pinata and return its IPFS hash (CID)
 * @param {Object} metadata - The metadata JSON object to upload
 * @returns {string} CID - The IPFS hash returned by Pinata
 */
const VITE_PINATA_JWT_API = import.meta.env.VITE_PINATA_JWT
export const uploadMetadataToPinata = async (metadata) => {
    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VITE_PINATA_JWT_API}`, // Replace with your JWT from Pinata
        },
        body: JSON.stringify(metadata),
      });
  
      if (!response.ok) {
        throw new Error("Failed to upload metadata to Pinata");
      }
  
      const data = await response.json();
      return data.IpfsHash; // The CID of the pinned JSON
    } catch (error) {
      console.error("Error uploading metadata:", error);
      throw error;
    }
  };
  
  /**
   * Create metadata JSON from event details and upload it to Pinata
   * @param {string} eventName - The event's name
   * @param {string} eventDescription - The event's description
   * @param {string} imageUrl - URL of the event banner or logo
   * @returns {string} CID - The IPFS hash of the uploaded metadata
   */
  export const createAndUploadMetadata = async (eventName, eventDescription, imageUrl) => {
    // Create the metadata JSON object
    const metadata = {
      name: eventName,
      description: eventDescription,
      image: imageUrl, // This should be the URL of your uploaded file
    };
  
    // Upload metadata JSON to Pinata and return the resulting CID
    const cid = await uploadMetadataToPinata(metadata);
    return cid;
  };
  