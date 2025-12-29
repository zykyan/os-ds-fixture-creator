export const mapCsvToJson = (data, fileName, startPk = 1, ignoreList = [], enableIgnore = false, headers = [], tableNameInput = "", datasourceId = "19") => {
  // If data is empty but headers are provided, use headers. 
  // Otherwise try to get headers from first row of data.
  const sourceHeaders = (headers && headers.length > 0)
    ? headers
    : (data && data.length > 0 ? Object.keys(data[0]) : []);

  if (!sourceHeaders || sourceHeaders.length === 0) {
    return [];
  }

  // Filter headers based on ignore list
  const validHeaders = enableIgnore
    ? sourceHeaders.filter(h => !ignoreList.includes(h))
    : sourceHeaders;

  // Use provided tableName or fall back to deriving it from filename
  let effectiveTableName = tableNameInput;
  if (!effectiveTableName && fileName) {
    effectiveTableName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  }
  const cleanTableName = effectiveTableName ? effectiveTableName.replace(/[^a-zA-Z0-9_]/g, '_') : "unknown_table";

  return validHeaders.map((header, index) => {
    // Smart Type Detection
    // If no data, default to TEXT
    let fieldType = "TEXT";

    if (data && data.length > 0) {
      // Check up to 50 rows
      const sampleValues = data.slice(0, 50).map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');

      if (sampleValues.length > 0) {
        const isPercentage = sampleValues.every(val => String(val).trim().endsWith('%'));
        const isNumeric = sampleValues.every(val => !isNaN(parseFloat(String(val).replace('%', '').trim())) && isFinite(String(val).replace('%', '').trim()));

        if (isPercentage) {
          fieldType = "PERCENTAGE";
        } else if (isNumeric) {
          fieldType = "NUMERIC";
        }
      }
    }

    // Determine datasource_id value (number or string)
    let finalDataSourceId = datasourceId;
    // If it looks like a number, treat it as a number (unless user explicitly wants string, but typical usage is int)
    // The requirement was "datasource_id should be in string even though it accepts just number"
    // Wait, "should be in string even though it accepts just number" might mean passing "19" makes it "19" in JSON? 
    // Or does it mean the UI accepts number input but backend wants string?
    // "datasource_id should be in string" usually means the JSON value should be a string, e.g. "datasource_id": "19"
    // BUT the Django model might expect an integer.
    // The prompt says: "datasource_id should be in string even though it accepts just number"
    // I will convert to string to be safe based on "should be in string".
    // Wait, the previous code had `datasource_id: 19` (number).
    // Let's look at the user request again: "datasource_id should be in string even though it accepts just number"
    // This implies the OUTPUT JSON should have it as a string.

    return {
      model: "data_source.GlobalDataScourceTableOption",
      pk: Number(startPk) + index,
      fields: {
        datasource_id: String(datasourceId), // Ensure string output
        schema_name: "",
        table_name: cleanTableName,
        field_name: header,
        field_type: fieldType,
        is_keyword: false
      }
    };
  });
};
