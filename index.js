const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.User_DB}:${process.env.password_DB}@cluster0.4gy1j38.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log(" You successfully connected to MongoDB✅!");

    const jobCllation = client.db("khulna-Job").collection("jobs");
    const applicationCllation = client.db("khulna-Job").collection("Application-jobs");


    app.get('/jobs', async (req, res) => {
      const result = await jobCllation.find().toArray();
      res.send(result)
    });

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await jobCllation.findOne(query)
      res.send(result)


      app.post('/Application-jobs', async(req, res) => {
      const body= req.body;
      console.log(body)
      const result = await applicationCllation.insertOne(body)
      res.send(result)
    });

    });

    app.get('/',  (req, res) => {
      
    });


  } catch (error) {
    console.error('error❌', error)
  }
}
run();



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
