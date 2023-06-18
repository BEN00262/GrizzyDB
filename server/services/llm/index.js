import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

// NOTE: switched to openai sdk due to langchain not offering support for gpt-3.5-turbo-16k
import { Configuration, OpenAIApi } from "openai";
import findAndParseJsonLikeText from 'json-like-parse';

// for the SQLAgent
import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";

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
        const template = `You are an experienced database adminstrator having used the different databases for a lot of years. Using your experience please generate ${dialects.join(", ")} optimized sql statements to bootstrap a database. Also generate sample data to be inserted into the generated database. The generated database and data should demonstrate relationships between the different tables. Only return the sql statements, no explanations. The response format should be an array of objects with the following format:

        {
            dialect: string, // e.g mysql
            sql_statements: string, // generated sql statement
        }
        `;

        const chatCompletion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo-16k",
            messages: [{
                role: "user", 
                content: template
            }],
            temperature: 0,
            max_tokens: 14385 /* 2k short */
        });

        // console.log(chatCompletion?.data?.choices?.[0]?.message?.content)

        return findAndParseJsonLikeText(chatCompletion?.data?.choices?.[0]?.message?.content);
    }

    /**
     * 
     * @param {string} schema 
     * @param {string[]} dialects
     */
    async generate_sample_data_for_schema(schema, dialects = []) {
        const template = `You are an experienced database adminstrator having used ${dialects.join(", ")} databases for a lot of years. Using your experience please generate ${dialects.join(", ")} optimized sql statements to bootstrap a simple database described by the schema provided below. Convert the schema provided to fit each of the stated dialects. Please respect any inter table relationships if any. Only return the sql statements for the data to insert, no explanations.The response format should be an array of objects with the following format:

        {
            dialect: string, // e.g mysql
            sql_statements: string, // generated sql statement
        }
        
        SQL SCHEMA
        ----------
        ${schema}
        `;

        const chatCompletion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo-16k",
            messages: [{
                role: "user", 
                content: template
            }],
            temperature: 0,
            max_tokens: 14385 /* 2k short */
        });

        return findAndParseJsonLikeText(chatCompletion?.data?.choices?.[0]?.message?.content);
    }

    async query_database_from_prompt(prompt, dialect, credentials = {}) {
        const datasource = new DataSource({
            type: dialect,
            host: process.env.MASTER_DB_URI,
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
    
        console.log(result);
    
        await datasource.destroy();
    
        return result?.output;
    }
}

// ;(async () => {
//     const GrizzyLLMInstance = new GrizzyLLM();

//     // testing the ability of gpt to generate random db schemas with data
//     console.log(
//         await GrizzyLLMInstance.generate_sample_data_templates(["mysql", "postgres", "mariadb"])
//     )

//     // testing ability of gpt to understand a schema and generate sample data that fits the schema
//     // console.log(
//     //     await GrizzyLLMInstance.generate_sample_data_for_schema(
//     //         `-- Create tables
//     //         CREATE TABLE users (
//     //             id INT AUTO_INCREMENT PRIMARY KEY,
//     //             name VARCHAR(50),
//     //             email VARCHAR(100)
//     //         );
            
//     //         CREATE TABLE cars (
//     //             id INT AUTO_INCREMENT PRIMARY KEY,
//     //             make VARCHAR(50),
//     //             model VARCHAR(50),
//     //             user_id INT,
//     //             FOREIGN KEY (user_id) REFERENCES users(id)
//     //         );`,
            
//     //         ["mysql", "postgres", "mssql"]
//     //     )
//     // )

// })()


export const GrizzyLLMInstance = new GrizzyLLM();