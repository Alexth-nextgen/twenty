import { defineFrontComponent } from 'twenty-sdk/define';

import { ADD_COMPANIES_TO_LIST_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AddRecordsToList } from 'src/front-components/components/AddRecordsToList';

const AddCompaniesToList = () => <AddRecordsToList target="COMPANIES" />;

export default defineFrontComponent({
  universalIdentifier:
    ADD_COMPANIES_TO_LIST_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'add-companies-to-list',
  description: 'Adds the selected companies to a Lists app list.',
  component: AddCompaniesToList,
});
