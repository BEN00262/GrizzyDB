const get_table_name = raw_table_name => raw_table_name?.split(".");

const importTablePositions = async (tables) => {
  const tables_per_row = Math.round(Math.sqrt(tables.length));

  const table_positions = tables.reduce((acc, {name: table_name}, index) => {
    const full_table_name = table_name.includes(".") ? table_name : `public.${table_name}`;

    const yPosition = Math.floor(index / tables_per_row);
    const xPosition = index % tables_per_row;

    acc[full_table_name] = {
      x: xPosition * 300,
      y: yPosition * 450
    };

    return acc;
  }, {});

  return table_positions;
};

export const generate_db_graph = async (data) => {
  const tables = [];
  const schemas = {};

  for (let [_table_name, table_structure] of Object.entries(data.tables)) {
      if (_table_name.toLowerCase() === 'public.sequelizemeta') {
          continue
      }

      let [schema_name, table_name] = get_table_name(_table_name);

      schemas[schema_name] = "#91C4F2";

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
              key: ts_value.primaryKey,
          });
      }

      tables.push({
          name: table_name,
          schemaColor: "#91C4F2",
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
            source: target_table,
            sourceKey: target_column,
            target: source_table,
            targetKey: source_column,

            relation: relationship_type
          });
        }
      }
    }
  }

  return { 
    schemaColors: schemas, 
    tablePositions: await importTablePositions(tables),
    tables,
    edgeConfigs: relationships 
  }
}