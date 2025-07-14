import { useParams } from "react-router-dom";
import { Product } from "../../types/concept";
import useApplicationConfigStore from "../../stores/ApplicationConfigStore";
import { useSearchConceptById } from "../../hooks/api/products/useSearchConcept";
import BaseModal from "../modal/BaseModal";
import BaseModalHeader from "../modal/BaseModalHeader";
import BaseModalBody from "../modal/BaseModalBody";
import BaseModalFooter from "../modal/BaseModalFooter";
import { Button } from "@mui/material";
import { ExistingDescriptionsSection } from "./ExistingDescriptionsSection";
import { useMemo, useState } from "react";
import useProjectLangRefsets from "../../hooks/api/products/useProjectLangRefsets";
import useAvailableProjects, { getProjectFromKey } from "../../hooks/api/useInitializeProjects";


interface DescriptionModalProps {
    open: boolean;
  handleClose: () => void;
  product: Product;
  keepMounted: boolean;
  branch: string;
}
export default function DescriptionModal({open,
    handleClose,
    product,
    keepMounted,
    branch} : DescriptionModalProps){
  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = `/${applicationConfig.apDefaultBranch}`;
    const [displayRetiredDescriptions, setDisplayRetiredDescriptions] = useState(false);
  const conceptId = product.conceptId;
  const {data, isLoading} = useSearchConceptById(conceptId, fullBranch);
  const { data: projects } = useAvailableProjects();
  const project = getProjectFromKey(applicationConfig?.apProjectKey, projects);
  const langRefsets = useProjectLangRefsets({project: project});

  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Concept Diagram Preview'} />
      <BaseModalBody sx={{ overflow: 'auto' }}>
        <ExistingDescriptionsSection 
        displayRetiredDescriptions={displayRetiredDescriptions}
        isFetching={isLoading}
        nonDefiningProperties={product.nonDefiningProperties}
            descriptions={data?.descriptions}
            isCtpp={false}
                    dialects={langRefsets}
                    title={''}
                    product={product}
                    branch={branch}
                    displayMode='text'
                    showBorder={false}
        />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button variant="contained" onClick={() => handleClose()}>
            Close
          </Button>
        }
      />
    </BaseModal>
  )
}