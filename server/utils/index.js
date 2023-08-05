import consola from 'consola';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import jwt from 'jsonwebtoken';

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