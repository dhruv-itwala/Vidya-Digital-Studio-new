import React from "react";
import CreatorList from "../../components/CreatorModule/CreatorList";

import {
  getugcCreatorsAPI,
  deleteUGCCreatorAPI,
  createUGCCreatorAPI,
  updateUGCCreatorAPI,
} from "../../api/ugcCreator.api";

export default function UGCCreator() {
  return (
    <CreatorList
      title="UGC Creators"
      getAPI={getugcCreatorsAPI}
      deleteAPI={deleteUGCCreatorAPI}
      createAPI={createUGCCreatorAPI}
      updateAPI={updateUGCCreatorAPI}
    />
  );
}
