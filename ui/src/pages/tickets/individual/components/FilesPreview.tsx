// material-ui
import { useTheme } from '@mui/material/styles';
import { List, ListItemText, ListItem, Typography } from '@mui/material';

// project import
import IconButton from '../../../../components/@extended/IconButton';

// utils
import getDropzoneData from '../../../../utils/helpers/tickets/getDropzoneData';

// type
import {
  DropzopType,
  FilePreviewProps,
} from '../../../../types/tickets/dropzone';

// assets
import { CloseCircleFilled, FileFilled } from '@ant-design/icons';

// ==============================|| MULTI UPLOAD - PREVIEW ||============================== //

// a list of all of the files, on the individual file when it is rendered we probably want to add an onClick to download otherwise this entire exercise seems pointless
export default function FilesPreview({
  showList = false,
  files,
  onRemove,
  type,
}: FilePreviewProps) {
  const theme = useTheme();
  const hasFile = files.length > 0;
  const layoutType = type;

  return (
    <List
      disablePadding
      sx={{
        ...(hasFile && type !== DropzopType.standard && { my: 3 }),
        ...(type === DropzopType.standard && { width: 'calc(100% - 84px)' }),
      }}
    >
      {files.map((file, index) => {
        const { key, name, size, preview, type } = getDropzoneData(file, index);
        // onClick to download the file here
        if (showList) {
          return (
            <ListItem
              key={key}
              sx={{
                // display: 'flex',
                flexDirection: 'column',
                p: 0,
                m: 0.5,
                width: layoutType === DropzopType.standard ? 64 : 80,
                height: layoutType === DropzopType.standard ? 64 : 80,
                borderRadius: 1.25,
                position: 'relative',
                display: 'inline-flex',
                verticalAlign: 'text-top',
                border: `solid 1px ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              {type?.includes('image') && (
                <img alt="preview" src={preview} style={{ width: '100%' }} />
              )}
              {!type?.includes('image') && (
                <FileFilled
                  style={{
                    width: '100%',
                    fontSize: '1.5rem',
                    marginTop: 'auto',
                    marginBottom: 'auto',
                  }}
                />
              )}
              <Typography variant="body2">{file.name}</Typography>
              {onRemove && (
                <IconButton
                  size="small"
                  color="error"
                  shape="rounded"
                  onClick={() => onRemove(file)}
                  sx={{
                    fontSize: '0.875rem',
                    bgcolor: 'background.paper',
                    p: 0,
                    width: 'auto',
                    height: 'auto',
                    top: 2,
                    right: 2,
                    position: 'absolute',
                  }}
                >
                  <CloseCircleFilled />
                </IconButton>
              )}
            </ListItem>
          );
        }

        return (
          <ListItem
            key={key}
            sx={{
              my: 1,
              px: 2,
              py: 0.75,
              borderRadius: 0.75,
              border: theme => `solid 1px ${theme.palette.divider}`,
            }}
          >
            <FileFilled
              style={{
                width: '30px',
                height: '30px',
                fontSize: '1.15rem',
                marginRight: 4,
              }}
            />

            <ListItemText
              primary={typeof file === 'string' ? file : name}
              secondary={typeof file === 'string' ? '' : size}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />

            {onRemove && (
              <IconButton
                edge="end"
                size="small"
                onClick={() => onRemove(file)}
              >
                <CloseCircleFilled style={{ fontSize: '1.15rem' }} />
              </IconButton>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
