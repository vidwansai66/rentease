const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    // Min 8 chars, 1 uppercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
};

const validatePhone = (phone) => {
    // 10-digit Indian mobile starting with 6-9
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
};

const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)
    );
};

const validatePincode = (pin) => {
    // 6-digit Indian pincode
    const re = /^[1-9][0-9]{5}$/;
    return re.test(pin);
};

module.exports = {
    validateEmail,
    validatePassword,
    validatePhone,
    isEmpty,
    validatePincode
};
