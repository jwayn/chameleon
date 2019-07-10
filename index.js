const app = require('http').createServer();
const io = require('socket.io')(app);

const port = process.env.PORT || 8080;

io.on('connection', (socket) => {
    console.log('A user has connected.');
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});