import indiaStateDistrict from "india-state-district";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const buildStateDistrictIndex = () => {
  const statesWithDistricts = indiaStateDistrict.getAllStatesWithDistricts();
  return statesWithDistricts.reduce((accumulator, stateEntry) => {
    const stateName = stateEntry?.name ?? stateEntry;
    const districtList = Array.isArray(stateEntry?.districts)
      ? stateEntry.districts.map((district) => district?.name ?? district)
      : [];

    accumulator[stateName] = districtList;
    return accumulator;
  }, {});
};

const main = () => {
  try {
    const stateDistrictMap = buildStateDistrictIndex();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputPath = path.join(__dirname, "stateDistricts.json");

    writeFileSync(outputPath, JSON.stringify(stateDistrictMap, null, 2), "utf-8");
    console.log(`State/district map saved to ${outputPath}`);
  } catch (error) {
    console.error("Failed to fetch state/district data:", error);
    process.exit(1);
  }
};

main();