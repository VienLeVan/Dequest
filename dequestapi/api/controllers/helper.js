const jwt = require('jsonwebtoken');
const moment = require('moment');

module.exports.APIReturn = function (code = 0, data = {}, mess = "") {
    if (code === 503) {
        code = 10;
        if (mess !== "")
            mess = "Miss fiend"
    }
    if (typeof data === 'string') {
        mess = data;
        data = {};
    }
    return {
        code, data, mess
    }
};

module.exports.sign_token = async function (object) {
    try {
        return await jwt.sign({...object}, process.env.PRIVATE_KEY_JSONTKEN);
    } catch (e) {
        console.error(e);
        return false;
    }
}

module.exports.verify_token = async function (token) {
    try {
        return await jwt.verify(token, process.env.PRIVATE_KEY_JSONTKEN);
    } catch (e) {
        console.error(e);
        return false;
    }
}

module.exports.auth = async function (req, res, next) {
    try {
        if (req.headers.authorization) {
            const parseToken = req.headers.authorization.split(' ');
            if (parseToken[0] === 'Bearer' && parseToken[1]) {
                const getToken = await helper.verify_token(parseToken[1]);
                if (getToken) {
                    return next();
                }
                return res.status(300).json(helper.APIReturn(1, 'Token is requied'));
            }
        }

        return res.status(300).json(helper.APIReturn(1, 'Token is requied'));
    } catch (e) {
        console.log(e);
        return res.status(500).json(helper.APIReturn(1, "Something errors"))
    }
}

module.exports.getDateToString = function (days) {
    const PATTERN = 'YYYY-MM-DD 00:00:00';
    if (!days) {
        return moment().format(PATTERN);
    }
    return moment().add(days, 'days').format(PATTERN);
}




