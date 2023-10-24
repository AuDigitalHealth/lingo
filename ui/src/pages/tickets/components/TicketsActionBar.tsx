import { FileDownload } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";


export default function TicketsActionBar(){

    return (
        <>
            <Stack sx={{width: '100%', padding: '1em 1em 1em 0em'}}>
                <Button
                    variant="contained"
                    color="info"
                    startIcon={<FileDownload/>}
                    sx={{marginLeft: 'auto'}}
                >
                    Create Adha Report
                </Button>
            </Stack>
        </>
    )
}