const express = require('express')
const router = express.Router()
// const path = require('path')
const usersData = require('../data/userFakeData')
router.use(express.urlencoded({ extended: true }))


// app.set('views', path.join(__dirname, '../views'))
// app.set('view engine', 'ejs')

router.post('/', (req, res) => {
    const loginData = req.body
    const user = usersData.find(c => c.username === loginData.username && c.password === parseInt(loginData.password))
    res.send(`here is the profile page for user: ${user.username}`)
})


module.exports = router;