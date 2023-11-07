import {
  Button,
  Stack,
  Typography,
  TypographyPropsVariantOverrides,
} from '@mui/material';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { Variant } from '@mui/material/styles/createTypography';

function Login() {
  const { applicationConfig } = useApplicationConfigStore();

  function handleLogin() {
    const snomioUrl: string = window.location.href;
    const imsUrl = applicationConfig?.imsUrl ? applicationConfig?.imsUrl : '';
    const redirectUrl = imsUrl + '/#/login?serviceReferer=' + snomioUrl;
    window.location.href = redirectUrl;
  }

  return (
    <>
      <Paragraph variant="subtitle1">
        Welcome to Snomio, a medicine authoring tool which has been developed by
        CSIRO for the Australian SNOMED CT national release centre.
      </Paragraph>
      <Paragraph>
        This will redirect you to the SI Authoring Platform so you can login
        using your Authoring Platform credentials, then you will automatically
        be redirected back to Snomio.
      </Paragraph>
      <Paragraph>
        Do not attempt to login to Snomio or the SI Authoring Platform unless
        you have been granted access.
      </Paragraph>
      <Button
        onClick={handleLogin}
        variant="contained"
        size="large"
        sx={{ margin: '1em' }}
      >
        Log In
      </Button>
      <Paragraph>
        Please ensure you logout of Snomio or the SI Authoring Platform at the
        end of your session.
      </Paragraph>
      <LoginFooter />
    </>
  );
}

interface ParagraphProps {
  children: string;
  variant?: Variant | undefined;
}

function Paragraph({ children, variant }: ParagraphProps) {
  return (
    <Typography margin={'1em 0'} variant={variant}>
      {children}
    </Typography>
  );
}

function LoginFooter() {
  return (
    <Stack alignItems={'baseline'} width="100%" marginTop={'2em'}>
      <Typography variant="body1" marginTop={'1em'}>
        <strong>
          Snomio Support:&nbsp;
          <a href="mailto:snomio-support@csiro.au">snomio-support@csiro.au</a>
        </strong>
      </Typography>

      <Typography variant="body1" marginTop={'1em'}>
        <strong>Associated Sites:&nbsp;</strong>
      </Typography>
      <Typography variant="body1">
        NCTS:&nbsp;
        <a href="https://www.healthterminologies.gov.au">
          https://www.healthterminologies.gov.au
        </a>
      </Typography>
      <Typography variant="body1">
        Australian Digital Health Agency:&nbsp;
        <a href="https://www.digitalhealth.gov.au">
          https://www.digitalhealth.gov.au
        </a>
      </Typography>
      <Typography variant="body1">
        SNOMED International:&nbsp;
        <a href="https://www.snomed.org">https://www.snomed.org</a>
      </Typography>
    </Stack>
  );
}

export default Login;
