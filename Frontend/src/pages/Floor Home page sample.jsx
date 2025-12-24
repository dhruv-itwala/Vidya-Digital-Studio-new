import React from "react";
import CD from "../components/CD";
import { floors } from "../assets/Data/MasterData";
import FloorSection from "../components/FloorSection/FloorSection";

const TestHomepAGE = () => {
  return (
    <>
      <FloorSection bg={floors.Floor1}>
        <CD title="CD — Content + 3D Model" />
      </FloorSection>

      <FloorSection bg={floors.Floor2}>
        <CD title="Service 2" />
      </FloorSection>

      <FloorSection bg={floors.Floor3}>
        <CD title="Service 3" />
      </FloorSection>

      <FloorSection bg={floors.Floor4}>
        <CD title="Service 4" />
      </FloorSection>

      <FloorSection bg={floors.Floor5}>
        <CD title="Service 5" />
      </FloorSection>

      <FloorSection bg={floors.Floor6}>
        <CD title="Service 6" />
      </FloorSection>
    </>
  );
};

export default TestHomepAGE;
