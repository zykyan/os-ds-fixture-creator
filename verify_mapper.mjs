import { mapCsvToJson } from './src/app/utils/csvMapper.js';
import assert from 'assert';

const sampleData = [
    {
        "conversions": "100",
        "view_percentage": "50%",
        "_airbyte_meta": "some metadata",
        "id": "123"
    }
];

const filename = "meta_ads_ads_insights.csv";
const startPk = 1;
const ignoreList = ["_airbyte_meta", "id"];
const enableIgnore = true;

const result = mapCsvToJson(sampleData, filename, startPk, ignoreList, enableIgnore);

console.log('Result:', JSON.stringify(result, null, 2));

assert.strictEqual(result.length, 2, "Should have 2 fields (4 total - 2 ignored)");

// Check present fields
const fieldNames = result.map(r => r.fields.field_name);
assert.ok(fieldNames.includes("conversions"), "conversions should be present");
assert.ok(fieldNames.includes("view_percentage"), "view_percentage should be present");

// Check ignored fields
assert.ok(!fieldNames.includes("_airbyte_meta"), "_airbyte_meta should be ignored");
assert.ok(!fieldNames.includes("id"), "id should be ignored");

console.log('Verification passed!');
