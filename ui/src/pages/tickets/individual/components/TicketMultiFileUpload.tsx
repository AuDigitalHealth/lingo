import { CustomFile, DropzopType } from '../../../../types/tickets/dropzone';
import { Ticket } from '../../../../types/tickets/ticket';
import MultiFileUpload from './MultiFile';

import { useFormik } from 'formik';

interface TicketMultiFileUpload {
  ticket?: Ticket;
}

// The idea is to use the attachments to initialize formik.values.initialValues,
// I haven't done that, because i'm not too sure about how the attachments will be set up after the change.
// It might be useful to have a way to differentiate between existing attachments and one's that are uploaded here by the user
// while they're on this screen.
// Also will need to implement onDelete, there is a method

export default function TicketMultiFileUpload({
  ticket,
}: TicketMultiFileUpload) {
  // const [attachments, setAttachments] = useState<Attachment[]>([]);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      files: [] as CustomFile[],
    },
    onSubmit: () => {
      console.log('durrr');
    },
  });

  const handleFileUpload = (attachment: CustomFile) => {
    attachment = Object.assign(attachment, {
      preview: URL.createObjectURL(attachment),
    });
    // TODO: You will need to post the attachment here, and set the value only if it succeeds,
    // (on that note, i'm not 100% sure whether the order of elements is preserved in the onDrop method of MultiFileUpload.. might need to look into react-dropzone for that)
    // alternatively you can raise a formik error, which will display the error on the attachment thingymagig
    // maybe you could call the formik onSubmit, so it's not just there doing nothing
    // If you want you could add a field to the file - like disabled/loading and temporarily disable/show a spinner it while it's uploading, this could be done by adding to the FilesPreview.tsx file
    // i guess a large file would probably take a long time and might be useful to have some user feedback
    // add the name of the file
    // add the ability to download the file
    void formik.setFieldValue('files', formik.values.files.concat(attachment));
  };

  return (
    <MultiFileUpload
      onFileDrop={handleFileUpload}
      type={DropzopType.standard}
      showList={true}
      // eslint-disable-next-line
      setFieldValue={formik.setFieldValue}
      files={formik.values.files}
      error={formik.touched.files && !!formik.errors.files}
    />
  );
}
