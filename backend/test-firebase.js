const { db } = require('./config/firebase');
db.collection('Users').limit(1).get()
  .then(() => console.log('Firebase connected successfully'))
  .catch(err => console.error('Firebase connection failed:', err));
