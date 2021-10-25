const AWS = require("aws-sdk");
const fs = require("fs");
const endpoint = new AWS.Endpoint("https://kr.object.ncloudstorage.com");
const region = "kr-standard";
const access_key = process.env.ACCESS_KEY;
const secret_key = process.env.SECRET_KEY;

module.exports = {
  processFile: (req, res) => {
    const S3 = new AWS.S3({
      endpoint,
      region,
      credentials: {
        accessKeyId: access_key,
        secretAccessKey: secret_key,
      },
    });

    console.log(process.env.SECRET_KEY);

    const bucket_name = "junhyuk-study";
    createBucket(bucket_name, S3);
    queryBuckitList(S3);
    downloadObject(bucket_name, S3);
    uploadObject(bucket_name, S3);
    queryObjectList(bucket_name, S3);

    res.render("index", { title: "Express" });
  },
};

const createBucket = (bucket_name, S3) => {
  (async () => {
    await S3.createBucket({
      Bucket: bucket_name,
      CreateBucketConfiguration: {},
    }).promise();
  })();
};

const queryBuckitList = (S3) => {
  (async () => {
    let { Buckets } = await S3.listBuckets().promise();

    for (let bucket of Buckets) {
      console.log(bucket.Name);
    }
  })();
};

const uploadObject = (bucket_name, S3) => {
  const local_file_path = "./test.png";

  (async () => {
    let object_name = "test-folder/";
    // create folder
    await S3.putObject({
      Bucket: bucket_name,
      Key: object_name,
    }).promise();

    object_name += "test.png";

    // upload file
    await S3.putObject({
      Bucket: bucket_name,
      Key: object_name,
      ACL: "public-read",
      // ACL을 지우면 전체공개가 되지 않습니다.
      Body: fs.createReadStream(local_file_path),
    }).promise();
  })();
};

const downloadObject = (bucket_name, S3) => {
  const object_name = "person.png";
  const local_file_path = "./test.png";

  (() => {
    let outStream = fs.createWriteStream(local_file_path);
    let inStream = S3.getObject({
      Bucket: bucket_name,
      Key: object_name,
    }).createReadStream();

    inStream.pipe(outStream);
    inStream.on("end", () => {
      console.log("Download Done");
    });
  })();
};

const queryObjectList = (bucket_name, S3) => {
  const MAX_KEYS = 300;

  var params = {
    Bucket: bucket_name,
    MaxKeys: MAX_KEYS,
  };

  (async () => {
    // List All Objects
    console.log("List All In The Bucket");
    console.log("==========================");

    while (true) {
      let response = await S3.listObjectsV2(params).promise();

      console.log(`IsTruncated = ${response.IsTruncated}`);
      console.log(`Marker = ${response.Marker ? response.Marker : null}`);
      console.log(
        `NextMarker = ${response.NextMarker ? response.NextMarker : null}`
      );
      console.log(`  Object Lists`);
      for (let content of response.Contents) {
        console.log(
          `    Name = ${content.Key}, Size = ${content.Size}, Owner = ${content.Owner?.ID}`
        );
      }

      if (response.IsTruncated) {
        params.Marker = response.NextMarker;
      } else {
        break;
      }
    }

    // List Top Level Folder And Files
    params.Delimiter = "/";
    console.log("Top Level Folders And Files In The Bucket");
    console.log("==========================");

    while (true) {
      let response = await S3.listObjectsV2(params).promise();

      console.log(`IsTruncated = ${response.IsTruncated}`);
      console.log(`Marker = ${response.Marker ? response.Marker : null}`);
      console.log(
        `NextMarker = ${response.NextMarker ? response.NextMarker : null}`
      );

      console.log(`  Folder Lists`);
      for (let folder of response.CommonPrefixes) {
        console.log(`    Name = ${folder.Prefix}`);
      }

      console.log(`  File Lists`);
      for (let content of response.Contents) {
        console.log(
          `    Name = ${content.Key}, Size = ${content.Size}, Owner = ${content.Owner?.ID}`
        );
      }

      if (response.IsTruncated) {
        params.Marker = response.NextMarker;
      } else {
        break;
      }
    }
  })();
};
