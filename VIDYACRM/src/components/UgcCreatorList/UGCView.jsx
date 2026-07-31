import { getugcCreatorsAPI } from "../../api/ugcCreator.api";
import ViewList from "../CreatorModule/ViewList";

export default function UGCView() {
  return <ViewList title="UGC Creators" getAPI={getugcCreatorsAPI} />;
}
