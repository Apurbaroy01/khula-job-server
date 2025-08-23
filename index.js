const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "https://next-heir.netlify.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(403).send({ message: "Forbidden: No token" });
  }

  jwt.verify(token, process.env.secret_key, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden: Invalid token" });
    }
    req.user = decoded;
    next();
  });
};





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
    // await client.connect();
    console.log(" You successfully connected to MongoDB✅!");

    const jobCllation = client.db("khulna-Job").collection("jobs");
    const applicationCllation = client.db("khulna-Job").collection("Application-jobs");

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.secret_key, { expiresIn: '5h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV==='production' ,
        sameSite: process.env.NODE_ENV==='production' ? "none": "strict"
      }).send({ success: true, token });
    });

    app.post('/logout', (req, res) => {
      res
      .clearCookie('token',{
        httpOnly:true,
        secure: process.env.NODE_ENV==='production' ,
        sameSite: process.env.NODE_ENV==='production' ? "none": "strict"
      })
      .send({})
    })

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      console.log(job)
      const result = await jobCllation.insertOne(job)
      res.send(result)
    });

    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      const sort = req.query?.sort;
      const search = req.query?.search;
      let query = {};
      let sortQuery={};
      

      if (email) {
        query = { email: email }
      }

      if(sort ==="true"){
        sortQuery={"salaryRange.min": -1}
      }

      if(search){
        query.location={$regex:search, $options: "i"}
      }
      console.log(query)

      
      const result = await jobCllation.find(query).sort(sortQuery).toArray();
      res.send(result)
    });


    app.delete('/jobs/:id', async (req, res) => {
      const id= req.params.id;
      console.log(id)
      const query={_id: new ObjectId(id)}
      const result = await jobCllation.deleteOne(query)
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


      const id = application.job_id;
      const query = { _id: new ObjectId(id) }
      const job = await jobCllation.findOne(query)

      let newCount = 0;
      if (job.aplocationCount) {
        newCount = job.aplocationCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          aplocationCount: newCount
        }
      }
      const updateResult = await jobCllation.updateOne(filter, updateDoc);
      console.log(updateResult)

      res.send(result)
    });

    app.get('/Application-jobs',verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }

      if (req.user?.email !== req.query.email) {
        return res.status(403).send({ error: true, message: "Forbidden access" });
      }



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


    app.delete('/Application-jobs/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query={_id: new ObjectId(id)}
      const result=await applicationCllation.deleteOne(query)
      res.send(result)

    });


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
      const Result = await applicationCllation.updateOne(query, updateDoc);
      res.send(Result)

    });



  } catch (error) {
    console.error('error❌', error)
  }
}
run();



app.get('/', (req, res) => {
  res.send('Hello Apurba!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
