import axios, { AxiosResponse } from 'axios';
import { saveAs } from 'file-saver';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';
import { AttachmentUploadResponse } from '../types/attachment';

const AttachmentService = {
  handleErrors: (error: string) => {
    throw new Error(error);
  },
  downloadAttachment(id: number): void {
    axios({
      url: '/api/attachments/download/' + id.toString(),
      method: 'GET',
      responseType: 'blob',
    })
      .then((res: AxiosResponse) => {
        const blob: Blob = new Blob([res.data], {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          type: res.headers['content-type'],
        });

        const actualFileName = getFileNameFromContentDisposition(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          res.headers['content-disposition'],
        );

        saveAs(blob, actualFileName);
      })
      .catch((error: Error) => {
        this.handleErrors(error.toString());
      });
  },

  async uploadAttachment(
    ticketId: number,
    file: File,
  ): Promise<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(
      `/api/attachments/upload/${ticketId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    if (response.status != 200) {
      let dataAsString;
      if (typeof response.data === 'string') {
        dataAsString = response.data;
      } else {
        dataAsString = JSON.stringify(response.data, null, 2);
      }
      this.handleErrors('Could not upload attachment' + dataAsString);
    }
    return response.data as AttachmentUploadResponse;
  },
};

export default AttachmentService;
