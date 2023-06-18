import fs from 'fs/promises';
import path from 'path';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const SCHEMA_COLORS_TEMPLATE_FILE = "./config/schemaColors.json.template";

const DATA_TYPES = {
  "character varying": "text",
  "timestamp without time zone": "timestamp"
}

const adjustDataTypeName = (rawName) => {
  if(DATA_TYPES[rawName]) {
    return DATA_TYPES[rawName];
  } else {
    return rawName;
  }
};

const readTableData = async (schema) => {
  const schemaData = schema.replaceAll('"', '').trim().split("\n").map(row => row.split(","));
  const [headers] = schemaData.splice(0, 1);

  const data = schemaData.map(row => {
    return Object.fromEntries(headers.map((key, index) => [key, row[index]]));
  });

  data.map(o => o.data_type = adjustDataTypeName(o.data_type));

  return data;
};

const importSchemaColors = async (schemas) => {
  const schemasTemplateFile = await fs.readFile(path.join(__dirname, SCHEMA_COLORS_TEMPLATE_FILE), "utf8");
  const defaultSchemaColors = JSON.parse(schemasTemplateFile);

  let schemaColors = Object.keys(schemas).reduce((acc, schemaName) => {
    acc[schemaName] = defaultSchemaColors.DEFAULT;
    return acc;
  }, {});

  schemaColors = {
    ...defaultSchemaColors,
    ...schemaColors
  };
  
  return schemaColors;
};

const importTablePositions = async (tables) => {
  const tableCount = Object.keys(tables).length;
  const tablesPerRow = Math.round(Math.sqrt(tableCount));

  const tablePositions = Object.keys(tables).reduce((acc, tableName, index) => {
    const fullTableName = tableName.includes(".") ? tableName : `public.${tableName}`;

    const yPosition = Math.floor(index / tablesPerRow);
    const xPosition = index % tablesPerRow;

    acc[fullTableName] = {
      x: xPosition * 300,
      y: yPosition * 450
    };
    return acc;
  }, {});

  return tablePositions;
};

const importTableConfigs = async (tables) => {
    const _tables = [];

  Object.keys(tables).forEach(async tableName => {
    const tableConfig = {
      name: tableName,
      description: "",
      schemaColor: "#91C4F2",
      columns: []
    };

    tables[tableName].forEach(row => {
      const columnName = row[0];
      const columnType = row[1];

      tableConfig.columns.push({
        name: columnName,
        description: "",
        type: columnType
      });
    });

    _tables.push(tableConfig);
  });

  return _tables;
};

// https://ourcodeworld.com/articles/read/608/how-to-camelize-and-decamelize-strings-in-javascript
const camelize = (text) => {
  return text.replace(/\W/, "-").replace(/^([A-Z])|[\s-_]+(\w)/g, function(match, p1, p2, offset) {
      if (p2) return p2.toUpperCase();
      return p1.toLowerCase();
  });
};

const importEdgeConfigs = async (tables) => {
    return [];
};

export const getDBSchemas = async (schema) => {
  const tableData = await readTableData(schema);
  const tables = {};
  const schemas = {};

  tableData.forEach(row => {
    schemas[row.table_schema] = true;

    const name = row.table_schema === "public" ? row.table_name : `${row.table_schema}.${row.table_name}`;

    if(tables[name]) {
      tables[name].push([row.column_name, row.data_type]);
    } else {
      tables[name] = [[row.column_name, row.data_type]];
    }
  });

  const [schemaColors, tablePositions, _tables, edgeConfigs] = await Promise.all([
    importSchemaColors(schemas),
    importTablePositions(tables),
    importTableConfigs(tables),
    importEdgeConfigs(tables),
  ])


  return {
    schemaColors,
    tablePositions,
    tables: _tables,
    edgeConfigs,
    // tables_index_file
  }
};