const VITE_PINATA_JWT_API = import.meta.env.VITE_PINATA_JWT
export const uploadToPinata = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
        name: "event-banner",
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
        cidVersion: 1,
    });
    formData.append("pinataOptions", options);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${VITE_PINATA_JWT_API}`, // Replace with your JWT from Pinata
            },
            body: formData,
        });

        const data = await res.json();
        return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
        console.error("Pinata upload failed:", error);
        return null;
    }
};
