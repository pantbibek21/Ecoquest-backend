const express = require("express");
const router = express.Router();

const {
    categories,
} = require("../data/mockData");

router.get("/", (req, res) => {
    res.json(categories);
});

router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const category = categories.find((c) => c.id === id);

    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
});

module.exports = router;