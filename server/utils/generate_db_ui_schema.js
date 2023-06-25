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

const get_table_name = raw_table_name => raw_table_name?.split(".")[1];

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
  const defaultSchemaColors = JSON.parse(
    await fs.readFile(path.join(__dirname, SCHEMA_COLORS_TEMPLATE_FILE), "utf8")
  );

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

const importEdgeConfigs = async (tables) => {
  return [];
};

export const generate_db_graph = async (data) => {
  try {
      const tables = [];
  
      for (let [table_name, table_structure] of Object.entries(data.tables)) {
          if (table_name.toLowerCase() === 'public.sequelizemeta') {
              continue
          }
  
          table_name = get_table_name(table_name)
  
          let columns = []
          
          for (const [ts_name, ts_value] of Object.entries(table_structure)) {
              switch (ts_value.type) {
                  case 'TIMESTAMP WITH TIME ZONE':
                      ts_value.type = 'DATE'
                      break;
                  default:
                      if (/CHARACTER VARYING\(\d+\)/.test(ts_value.type)) {
                          const value = ts_value.type.match(/\d+/)[0]
                          ts_value.type = `VARCHAR(${+value})`
                      }
              }
  
              columns.push({
                  name: ts_name,
                  type: ts_value.type,
                  key: ts_value.primaryKey
              });
          }
  
          tables.push({
              name: table_name,
              columns
          })
      }

      const relationships = [];

      for (const [table, entries] of Object.entries(data.foreignKeys)) {
        for (const [column, attributes] of Object.entries(entries)) {
          if (attributes?.isForeignKey) {
            const { 
              source_table, source_schema, target_schema, 
              source_column, target_table, target_column 
            } = attributes.foreignSources;

            const relation = data.relations.find(
              ({ parentId, parentTable, childTable }) => {
                return parentId === column && 
                  `${source_schema}.${source_table}` === childTable && 
                  `${target_schema}.${target_table}` === parentTable;
              }
            );

            if (relation) {
              let relationship_type = relation.isM2M ? 'hasMany' : relation.isOne ? 'hasOne' : 'hasMany';

              relationships.push({
                source: source_table,
                sourceKey: source_column,
                target: target_table,
                targetKey: target_column,

                relation: relationship_type
              });
            }
          }
        }
      }

      return { tables, relationships }
  } catch(error) {
      throw error;
  }
}

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