const express = require('express')
const router = express.Router()
// const path = require('path')
const { v4: uuidv4 } = require('uuid');
const usersData = require('../data/userFakeData')
router.use(express.urlencoded({ extended: true }))


// app.set('views', path.join(__dirname, '../views'))
// app.set('view engine', 'ejs')

// get all Users
router.get('/', (req, res) => {
    res.json(usersData)
})

// get one User
router.get('/:id', (req, res) => {
    const id = Number(req.params.id)
    const user = usersData.find((c) => c.id === id)
    return res.json(user)
})

// edit user profile information 
router.put('/:id', (req, res) => {
    const id = Number(req.params.id)
    const { userName, password, email } = req.body
    const userUpdated = usersData.find((c) => c.id === id)
    const userBefore = JSON.stringify(userUpdated);
    userUpdated.username = userName
    userUpdated.password = password
    userUpdated.email = email
    res.send(`user was **** ${userBefore} *** und then updated to ${JSON.stringify(userUpdated)} `)

})


// create a new user 
router.post('/signup', (req, res) => {
    const { username, password, email} = req.body
    usersData.push({ id: uuidv4(), username, password, email})
    res.send(usersData)
})


// delete a user account 
router.delete('/:id', (req, res) => {
    const id = Number(req.params.id) 
    const newUsersData = usersData.filter(c => c.id !== id);
    res.send(newUsersData)
}) 

router.post('/', (req, res) => {
    const loginData = req.body
    const user = usersData.find(c => c.username === loginData.username && c.password === parseInt(loginData.password))
    return res.json(user)
})


module.exports = router;