const { MongoClient, ServerApiVersion } = require('mongodb');


const state = {
    db: null,
}

exports.connect = function (url, done) {
    if (state.db) return done()
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    client.connect(err => {

        if (err) {
            console.log('Unable to connect to Mongo.');
            console.log('error : ', err);
            process.exit(1)
        }
        else{
            state.db = client.db(process.env.DB_NAME);
            console.log('connect successfull to...',process.env.DB_NAME);
            done();
        }
    });


}

exports.get = function () {
    return state.db
}
