import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

// NOTE: switched to openai sdk due to langchain not offering support for gpt-4o-mini
import { Configuration, OpenAIApi } from "openai";
import findAndParseJsonLikeText from 'json-like-parse';

// for the SQLAgent
import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";
import MarkdownIt from 'markdown-it';
import * as yup from 'yup';

const sample_data_format = yup.array().of(
    yup.object().shape({
        dialect: yup.string().required(),
        sql_statements: yup.string().required()
    })
);

class GrizzyLLM {
    constructor() {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this.openai = new OpenAIApi(configuration);
    }

    /**
     * 
     * @param {string} prompt 
     * @param {string[]} dialects
     */
    async generate_sample_data_templates(dialects = []) {
        const template = `You are an experienced database adminstrator having used ${dialects.join(", ")} databases for a lot of years. Using your experience please generate ${dialects.join(", ")} optimized sql statements to bootstrap tables within a sample database. Also generate sample data to be inserted into the generated database. The generated database and data should demonstrate relationships between the different tables. Only return the sql statements, no explanations. The response format should be an array of objects with the following format:

        {
            dialect: string, // e.g mysql
            sql_statements: string, // generated sql statement
        }
        `;

        const chatCompletion = await this.openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [{
                role: "user", 
                content: template
            }],
            temperature: 1,
            max_tokens: 14385 /* 2k short */
        });

        const md = new MarkdownIt();

        const extracted_formatted_sql_data = chatCompletion?.data?.choices?.[0]?.message?.content?.trim();
    
        const tokens = md.parse(extracted_formatted_sql_data, {});

        const sql_statements = tokens
          .filter(token => token.type === 'fence' && token.info.trim() === 'json' && sample_data_format.isValidSync(JSON.parse(token.content)))
          .map(token => JSON.parse(token.content));

        return sql_statements[0];
    }

    /**
     * 
     * @param {string} schema 
     * @param {string[]} dialects
     */
    async generate_sample_data_for_schema(schema, dialects = []) {
        const template = `You are an experienced database adminstrator having used ${dialects.join(", ")} databases for a lot of years. Using your experience please generate sample data with a minimum of 11 rows to be used as a seed for the databases as defined by the schema provided below. Please respect any inter table relationships if any. Only return the sql statements for the data to insert, no explanations.The response format should be an array of objects with the following format:

        {
            dialect: string, // e.g mysql
            sql_statements: string, // generated sql statement which is a combination of all generated sql statements for a given dialect e.g all sql statements for mysql. This should a string of all of the statements
        }
        
        SQL SCHEMA
        ----------
        ${schema}
        `;

        const chatCompletion = await this.openai.createChatCompletion({
            model: "gpt-4o-mini",
            
            messages: [{
                role: "user", 
                content: template
            }],
            temperature: 0
        });

        const md = new MarkdownIt();

        const extracted_formatted_sql_data = chatCompletion?.data?.choices?.[0]?.message?.content?.trim();
    
        const tokens = md.parse(extracted_formatted_sql_data, {});

        const sql_statements = tokens
          .filter(token => token.type === 'fence' && token.info.trim() === 'json' && sample_data_format.isValidSync(JSON.parse(token.content)))
          .map(token => JSON.parse(token.content));

        return sql_statements[0];
    }

    /**
     * 
     * @param {string} prompt 
     * @param {string} dialect 
     * @param {object} [credentials={}] 
     * @returns {string}
     */
    async query_database_from_prompt(prompt, dialect, credentials = {}) {
        const datasource = new DataSource({
            type: dialect,
            host: process.env.MASTER_MARIADB_URI,
            database: credentials.DB_NAME,
            username: credentials.DB_USER,
            password: credentials.DB_PASSWORD,
        });
        
        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: datasource,
        });
          
        const model = new OpenAI({ 
            temperature: 0,
            openAIApiKey: process.env.OPENAI_API_KEY 
        });
    
        const toolkit = new SqlToolkit(db, model);
        const executor = createSqlAgent(model, toolkit);
    
        const result = await executor.call({ input: prompt });
    
        await datasource.destroy();
    
        return result?.output;
    }
}

export const GrizzyLLMInstance = new GrizzyLLM();