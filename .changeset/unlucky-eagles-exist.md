---
"monarch-orm": minor
---

Add find cursor support

As an alternative to find(...).exec() the new find(...).cursor() returns a MongoDb cursor which implements AsyncIterator.
This allows you to consume the returned documents without loading all into memory in an array.