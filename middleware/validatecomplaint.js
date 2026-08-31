function validateComplaint(req, res, next) {

    const {
        studentName,
        category,
        title,
        description
    } = req.body;

    if (
        !studentName ||
        !category ||
        !title ||
        !description
    ) {

        return res.status(400).json({

            success: false,

            message: "All complaint fields are required."

        });

    }

    next();
}

module.exports = validateComplaint;