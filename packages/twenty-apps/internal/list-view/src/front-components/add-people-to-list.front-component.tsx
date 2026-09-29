import { defineFrontComponent } from 'twenty-sdk/define';

import { ADD_PEOPLE_TO_LIST_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AddRecordsToList } from 'src/front-components/components/AddRecordsToList';

const AddPeopleToList = () => <AddRecordsToList target="PEOPLE" />;

export default defineFrontComponent({
  universalIdentifier: ADD_PEOPLE_TO_LIST_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'add-people-to-list',
  description: 'Adds the selected people to a Lists app list.',
  component: AddPeopleToList,
});
