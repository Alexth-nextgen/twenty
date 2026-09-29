import axios from 'axios';
export const putFileToUploadUrl = async ({
  fileBuffer,
  uploadUrl,
  contentType,
}: {
  fileBuffer: Buffer;
  uploadUrl: string;
  contentType: string;
}): Promise<void> => {
  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
};
