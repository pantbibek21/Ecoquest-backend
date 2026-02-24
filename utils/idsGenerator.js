const Counter = require('../models/idsCounter')

module.exports = function createMongoIdGenerator(name = 'default', startAt = 0) {
    return async function generateId() {
        const doc = await Counter.findOneAndUpdate(
             { _id: name},
             { $inc: { seq: 1}},
             {
                new: true,
                upsert: true,
             }
        );

        return doc.seq;
    };
}