/* Shared query validation for the lesson, search and teacher routes. */
function validateCountry(req, res, next) {
    const country = req.query.country;
    if (country !== undefined && country !== 'UAE' && country !== 'UK') {
        return res.status(400).json({ error: 'country must be UAE or UK' });
    }
    next();
}

module.exports = validateCountry;
