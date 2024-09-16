const _ajv = require('ajv')
const addFormats = require("ajv-formats")

const verifySchema = (Schema, requestedJSON) => {
    let result = {};
    const ajv = new _ajv({
        allErrors: true,
    });
    try {
        addFormats(ajv)
        ajv.addFormat("validString", /^[a-zA-Z]+$/)
        ajv.addFormat("alphaNumeric", /^[a-zA-Z0-9]+$/);
        const validate = ajv.compile(Schema);
        const valid = validate(requestedJSON);
        if (!valid) {
            // eslint-disable-next-line max-len
            let errMessage = {}
            const newArr = validate.errors.map((er) => {
                if (er.instancePath) {
                    return errMessage = {
                        "message": er.message,
                        "params": er.params,
                        "path": er.instancePath

                    };
                } else {
                    return errMessage = {
                        "message": er.message,
                        "params": er.params,
                    };
                }

            })
            result = {
                success: false,
                message: newArr
            };
        } else {
            result = {
                success: true,
                message: 'requested JSON is valid',
            };
        }
    } catch (err) {
        console.log(err);
        result = {
            success: false,
            message: err,
        };
    }
    return result;
};
module.exports = verifySchema;
