///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import axios, { AxiosResponse } from 'axios';
import { saveAs } from 'file-saver';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';
import { AttachmentUploadResponse } from '../types/attachment';
import { api } from './api.ts';

const AttachmentService = {
  // eslint-disable-next-line
  handleErrors: (error: string, data: any) => {
    let dataAsString;
    if (typeof data === 'string') {
      dataAsString = data;
    } else {
      dataAsString = JSON.stringify(data, null, 2);
    }
    throw new Error(error + dataAsString);
  },
  downloadAttachment(
    id: number,
  ): Promise<void | { blob: Blob; actualFileName: string }> {
    return axios({
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

        return { blob, actualFileName };
      })
      .catch((error: Error) => {
        this.handleErrors(error.toString(), '');
      });
  },

  downloadAttachmentAndSave(id: number) {
    return this.downloadAttachment(id).then(result => {
      if (result) {
        saveAs(result.blob, result.actualFileName);
      }
    });
  },

  async uploadAttachment(
    ticketId: number,
    file: File,
  ): Promise<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
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
    const response = await api.delete(`/api/attachments/${attachmentId}`);
    if (response.status != 204) {
      this.handleErrors('Could not delete attachment', response.data);
    }
    return response;
  },
};

export default AttachmentService;
