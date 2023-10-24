import axios, { AxiosResponse } from 'axios';
import { saveAs } from 'file-saver';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';

const AttachmentService = {
  downloadAttachment(id: number): void {
    axios({
      url: '/api/download/' + id.toString(),
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
      .catch(error => {
        console.error(error);
      });
  },
};

export default AttachmentService;
