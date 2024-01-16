import axios, { AxiosResponse } from 'axios';
import { saveAs } from 'file-saver';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';
import { AttachmentUploadResponse } from '../types/attachment';

const AttachmentService = {
  handleErrors: (error: string, data: any) => {
    let dataAsString;
    if (typeof data === 'string') {
      dataAsString = data;
    } else {
      dataAsString = JSON.stringify(data, null, 2);
    }
    throw new Error(error + dataAsString);
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
        this.handleErrors(error.toString(), '');
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
      this.handleErrors('Could not upload attachment', response.data);
    }
    return response.data as AttachmentUploadResponse;
  },
  async deleteAttachment(attachmentId: number): Promise<AxiosResponse> {
    const response = await axios.delete(`/api/attachments/${attachmentId}`);
    if (response.status != 200) {
      this.handleErrors('Could not delete attachment', response.data);
    }
    return response;
  },
};

export default AttachmentService;
