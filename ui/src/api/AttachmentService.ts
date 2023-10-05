import axios, { AxiosResponse } from 'axios';
import { saveAs } from 'file-saver';

const AttachmentService = {
  
  getFileNameFromContentDisposition(contentDisposition: string): string  {
    if (!contentDisposition) {
      return '';
    }
    
    const match = contentDisposition.match(/filename="?([^"]+)"?/);  
    return match ? match[1] : '';
  },


  downloadAttachment(id: number): void {
      axios({
          url: '/api/download/' + id.toString(),
          method: 'GET',
          responseType: 'blob',
      }).then((res: AxiosResponse) => {
        const blob: Blob = new Blob([res.data], {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            type: res.headers["content-type"]
        });
    
        const actualFileName =this.getFileNameFromContentDisposition(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          res.headers["content-disposition"]
        );
    
        saveAs(blob, actualFileName);
      }).catch((error) => {
        console.error(error);
      });
  }

};

export default AttachmentService;
