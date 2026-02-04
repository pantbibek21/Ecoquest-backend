const express = require("express");
const router = express.Router();
const Category = require("../models/category");

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ id: 1 });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch categories" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: "id muss eine Nummer sein!" });
        }

        const category = await Category.findOne({ id });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch category" });
    }
});

module.exports = router;
