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

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      console.log(job)
      const result = await jobCllation.insertOne(job)
      res.send(result)
    });

    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email }
      }

      const result = await jobCllation.find(query).toArray();
      res.send(result)
    });

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await jobCllation.findOne(query)
      res.send(result)
    });

    app.post('/Application-jobs', async (req, res) => {
      const application = req.body;
      console.log(application)
      const result = await applicationCllation.insertOne(application)


      const id= application.job_id;
      const query = { _id: new ObjectId(id) }
      const job = await jobCllation.findOne(query)

      let newCount = 0;
      if(job.aplocationCount){
        newCount = job.aplocationCount + 1;
      }else{
        newCount = 1;
      }

      const filter ={ _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          aplocationCount: newCount
        }
      }
      const updateResult = await jobCllation.updateOne(filter, updateDoc);
      console.log(updateResult)

      res.send(result)
    });

    app.get('/Application-jobs', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }
      const result = await applicationCllation.find(query).toArray();

      for (const application of result) {
        const jobId = application.job_id;
        console.log(jobId)
        const query1 = { _id: new ObjectId(jobId) }
        const job = await jobCllation.findOne(query1)
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      };

      res.send(result)

    });

    app.get('/Application/jobs/:id', async (req, res) => {
      const jobId = req.params.id;
      const query = { job_id: jobId }
      const result = await applicationCllation.find(query).toArray();
      res.send(result)
    })
    app.get('/Application/jobApplication/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await applicationCllation.findOne(query);
      res.send(result)
    })


    app.patch('/Application-jobs/:id', async (req, res) => {
      const id = req.params.id;
      const application = req.body;
      console.log(application, id)
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: application.status,
        }
      }
      const Result = await applicationCllation.updateOne(query, updateDoc );
      res.send(Result)
      
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
