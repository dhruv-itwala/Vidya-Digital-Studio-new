import React from "react";
import CreatorList from "../../components/CreatorModule/CreatorList";

import {
  getInfluencersAPI,
  deleteInfluencerAPI,
  createInfluencerAPI,
  updateInfluencerAPI,
} from "../../api/influencers.api";
import Maintenance from "../Maintenance/Maintenance";

export default function Influencer() {
  return (
    // <CreatorList
    //   title="Influencers"
    //   getAPI={getInfluencersAPI}
    //   deleteAPI={deleteInfluencerAPI}
    //   createAPI={createInfluencerAPI}
    //   updateAPI={updateInfluencerAPI}
    //   pagelimit={50}
    // />
    <Maintenance />
  );
}
