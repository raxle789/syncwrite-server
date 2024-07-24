const express = require('express');
const app = express();
const router = express.Router();

router.route('/users')
  .get((req, res) => {
    res.send('Get all users');
  })
  .post((req, res) => {
    res.send('Create a new user');
  });

app.use('/', router);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
