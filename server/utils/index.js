import DotEnv from 'dotenv';
import FindConfig from 'find-config';

DotEnv.config({
    path: FindConfig('.env')
});

import consola from 'consola';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  region: 'eu-west-2'
});

/**
 *
 * @param {*} payload
 * @returns {string}
 */
export const signJwtToken = payload => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: `${process.env.JWT_TOKEN_TIME}h`
    })
}


/**
 *
 * @param {string} jwtToken
 * @returns
 */
export const verifyJwtToken = jwtToken => jwt.verify(jwtToken, process.env.JWT_SECRET);

const __dirname = dirname(
    fileURLToPath(import.meta.url)
);


export class GrizzyDBException extends Error {
    constructor(message) {
        super(message);
    }
}


/**
 * @description return a massaged error response ( common in the app )
 * @param {Error} error
 * @param {Response} res
 */
export const massage_error = (error, res, status_code = 400) => {
    consola.error(error);

    const isGrizzyDBException = error instanceof GrizzyDBException;

    res.status(isGrizzyDBException ? status_code : 500).json({
        status: 'failed',
        data: {
            errors: [
                isGrizzyDBException ? error.message : "There was a problem. Please try again later."
            ]
        }
    });
} 

/**
 * @description return a massaged error response ( common in the app )
 * @param {*} payload
 * @param {Response} res
 * @param {number} code
 */
export const massage_response = (payload, res, code = 200) => {
    return res.status(code).json({
        status: 'success',
        data: { ...payload }
    })
}

export async function get_installation_instructions_markdown(context = {}) {
    const installation_instructions = await fs.readFile(path.join(__dirname, './installation.md'), 'utf-8');
    return  handlebars.compile(installation_instructions)(context);
}

/**
 * @description used to massage names to snakecase for valid db names
 * @param {string} name 
 * @param {number} [maxLength=32] 
 */
export function morph_name_to_valid_database_name(name, maxLength = 32) {
    let dbName = name.replace(/\s/g, '_');
    dbName = dbName.slice(0, maxLength).trim();
    return dbName?.toLowerCase();
}


export const upload_file_to_s3 = async (file_path) => {
    const file = await fs.readFile(file_path);

    const params = {
        Body: file,
        ACL: 'public-read',
        ContentType: 'text/plain',
        ContentDisposition: 'inline',
        Bucket: process.env.BUCKET_NAME,
        Key: `sql_dumps/${nanoid(16)}`,
    };

    return s3.upload(params).promise();
};

// download the file with a given key
export const download_sql_dump_file = async key => {
    return s3.getObject({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    }).promise();
}

export const delete_sql_dump_file = async key => {
    return s3.deleteObject({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    }).promise();
}

export const generate_signed_url_helper = async key => {
    return s3.getSignedUrl('getObject', {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Expires: 60 * 60 * 5 // links should be valid for only 5 hours
    })
}

/**
 * 
 * sudo apt install postgresql postgresql-contrib
 * sudo apt install mysql-client
 */