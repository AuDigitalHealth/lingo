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

/* eslint-disable */
// material-ui
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/material';

//third-party
import { DropzoneOptions } from 'react-dropzone';

// ==============================|| TYPES - DROPZONE  ||============================== //

export enum DropzopType {
  default = 'DEFAULT',
  standard = 'STANDARD',
}

export interface CustomFile extends File {
  path?: string;
  preview?: string;
  lastModifiedDate?: Date;
}

export interface UploadProps extends DropzoneOptions {
  error?: boolean;
  file: CustomFile[] | null;
  setFieldValue: (field: string, value: any) => void;
  sx?: SxProps<Theme>;
}

export interface UploadMultiFileProps extends DropzoneOptions {
  files?: CustomFile[] | null;
  error?: boolean;
  showList?: boolean;
  type?: DropzopType;
  sx?: SxProps<Theme>;
  onFileDrop: (file: CustomFile) => void;
  onUpload?: VoidFunction;
  onRemove?: (file: File | string) => void;
  onRemoveAll?: VoidFunction;
  setFieldValue: (field: string, value: any) => void;
}

export interface FilePreviewProps {
  showList?: boolean;
  type?: DropzopType;
  files: File[];
  onRemove?: (file: File | string) => void;
}
