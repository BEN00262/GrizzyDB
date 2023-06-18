import consola from 'consola';

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