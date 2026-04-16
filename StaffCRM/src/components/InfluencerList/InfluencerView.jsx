import { getInfluencersAPI } from "../../api/influencers.api";
import ViewList from "../CreatorModule/ViewList";

export default function InfluencerView() {
  return <ViewList title="Influencers" getAPI={getInfluencersAPI} />;
}
