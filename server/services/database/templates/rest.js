import YAML from 'json-to-pretty-yaml';
import pluralize from 'pluralize';

function map_types(type) {
    type = type.toLowerCase();

    if (type.startsWith('varchar') || type.startsWith('string') || type.startsWith('text')) {
        return 'string';
    }

    if (type.startsWith('int') || type.startsWith('bigint')) {
        return 'integer';
    }

    return type;
}

export function generate_rest_endpoints(
    tables
) {
    const vm = new VM();

    return `function (connection) {
        const RadixRouter = require('radix-router');

        const tables = [${tables.map(({ name }) => `'${name}'`).join(", ")}];

        const router = new RadixRouter({
            strict: true,
            routes: tables.map(table => {
                const table_name = table.toLowerCase();

                return [
                    {
                        path: '/'+table_name,
                        handler: (req, res) => {
                            switch (req.method.toLowerCase()) {
                                case 'post':
                                    break;
                            }
                        }
                    },
                    {
                        path: '/'+table_name+'/all',
                        handler: async (req, res) => {
                            switch (req.method.toLowerCase()) {
                                case 'get':
                                    {
                                        const records = await connection.query('SELECT * FROM ' + table);
                                    }
                            }
                        }
                    },
                    {
                        path: '/'+table_name+'/:id',
                        handler: (req, res) => {
                            switch (req.method.toLowerCase()) {
                                case 'get':
                                    break;
                                case 'put':
                                    break;
                                case 'delete':
                                    break;
                            }
                        }
                    }
                ]
            })
        });

        return (req, res) => {
            const url = req.url;
            return router?.lookup(url)?.(req, res);
        }
    }`
}

export function generate_openapi_documentation(
    database, tables
) {
    const paths = {};
    const schemas = {}

    // loop through the tables and do your stuff
    for (const table of tables) {
        // create the schema of the table
        schemas[table.name] = {
            type: 'object',

            // loop through the columns and generate this
            properties: table.columns.reduce((acc, { name, type }) => {
                return {
                    ...acc,
                    [name]: {
                        type: map_types(type)
                    }
                }
            }, {})
        }

        paths[`/${table.name.toLowerCase()}`] = {
            post: {
                tags: [table.name.toLowerCase()].filter(u => u),
                summary: `create ${pluralize.plural(table.name)}`,
                description: `create ${pluralize.plural(table.name)}`,
                requestBody: {
                    description: `created ${pluralize.plural(table.name)} object`,
                    content: {
                        'application/json': {
                            schema: {
                                '$ref': `#/components/schemas/${table.name}`
                            }
                        }
                    }
                },
                responses: {
                    default: {
                        description: 'successful operation',
                        content: {
                            'application/json': {
                                schema: {
                                    '$ref': `#/components/schemas/${table.name}`
                                }
                            }
                        }
                    }
                }
            }
        };

        paths[`/${table.name.toLowerCase()}/all`] = {
            get: {
                tags: [table.name.toLowerCase()].filter(u => u),
                summary: `lists all ${pluralize.plural(table.name)}`,
                description: `lists all ${pluralize.plural(table.name)}`,
                responses: {
                    '200': {
                        description: 'successful operation',
                        content: {
                            'application/json': {
                                schema: {
                                    '$ref': `#/components/schemas/${table.name}`
                                }
                            }
                        }
                    }
                }
            }
        };

        paths[`/${table.name.toLowerCase()}/{id}`] = {
            // dynamically figure out the primary key and use it here
            get: {
                tags: [table.name.toLowerCase()].filter(u => u),
                summary: `get ${pluralize.singular(table.name.toLowerCase())} by id`,
                description: '',
                parameters: {
                    name: 'id',
                    in: 'path',
                    description: `The id of the ${pluralize.singular(table.name)} to be fetched.`,
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                },
                responses: {
                    '200': {
                        description: 'successful operation',
                        content: {
                            'application/json': {
                                schema: {
                                    '$ref': `#/components/schemas/${table.name}`
                                }
                            }
                        }
                    },

                    '400': {
                        description: 'Invalid id supplied'
                    },

                    '404': {
                        description: `${pluralize.singular(table.name)} not found`
                    }
                }
            },

            put: {
                tags: [table.name.toLowerCase()].filter(u => u),
                summary: `update ${table.name.toLowerCase()} by id`,
                description: '',
                parameters: {
                    name: 'id',
                    in: 'path',
                    description: `The id of the ${pluralize.singular(table.name)} to be fetched.`,
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                },
                requestBody: {
                    description: `update an existent ${pluralize.singular(table.name)} in the database`,
                    content: {
                        'application/json': {
                            schema: {
                                '$ref': `#/components/schemas/${table.name}`
                            }
                        }
                    }
                },
                responses: {
                    default: {
                        description: 'successful operation'
                    }
                }
            },

            delete: {
                tags: [table.name.toLowerCase()].filter(u => u),
                summary: `delete ${pluralize.singular(table.name.toLowerCase())}`,
                description: '',
                parameters: {
                    name: 'id',
                    in: 'path',
                    description: `The id of the ${pluralize.singular(table.name)} to be deleted.`,
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                },
                responses: {
                    '400': {
                        description: 'Invalid id supplied'
                    },

                    '404': {
                        description: `${pluralize.singular(table.name)} not found`
                    }
                }
            }
        }
    }


    return YAML.stringify({
        openapi: '3.0.3',
        info: {
            title: `${database} - OpenAPI 3.0`
        },

        servers: {
            url: `/${database}/rest/`
        },
        paths,
        components: {
            schemas
        }
    })
}