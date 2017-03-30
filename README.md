#node-couchbase-repository

Create a repository for model backed by couchbase bucket. Based on spring data repository pattern.

##Requirements
* node __^7.6.0__

##Installation
```
npm install --save couchbase couchbase-repository
```

##Usage
```
import couchbase from 'couchbase';
import createCouchbaseRepository from 'couchbase-repository';
import yup from 'yup';

const cluster = new couchbase.Cluster(<insert url here ...>);

// use yup or any other object validation framework you want
const personSchema =
  yup.object().shape({
    name: yup.string().required(),
    email: yup.string().email().required()
  });

const personRepository = createRepository({
  cluster,
  bucketName: 'my-bucket',
  type: 'people',
  async validate (input) { // expecting validate function to return a promise
    return personSchema.validate(input);
  }
});

async function doWork() {
  const newPerson = await personRepository.save({ name: 'Joe Blow', email: 'jblow@blah.com' });

  console.log(newPerson.id); // will print a uuid

  const existingPerson = await personRepository.findOne('1231-1213-11-1231');

  await personRepository.del('1231-123-123-1312');
}

```

##License
MIT
