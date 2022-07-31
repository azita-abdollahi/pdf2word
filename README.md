# A Dockerized PDF to Word converter using Express.JS & MongoDB



An Application to convert text and scanned PDF files to word document.
We use `MongoDB` as database for store files and metadata.



#### Used packages:

- [`Mongoose`](https://mongoosejs.com/docs/) (This package will translate the node.JS code to MongoDB)
- [`Config`](https://www.npmjs.com/package/config) (It lets you define a set of default parameters, and extend them for different deployment environments.
- [`Express`](https://www.npmjs.com/package/express) (You’ll need this package for any HTTP requests you want to run)
- [`BodyParser`](https://www.npmjs.com/package/body-parser) (This package lets you receive content from HTML forms)
- [`Multer`](https://www.npmjs.com/package/multer) (This package enables easy file upload into MongoDB
- [`Gridfs-stream`](https://www.npmjs.com/package/gridfs-stream) (Easily stream files to and from MongoDB [`GridFS`](http://www.mongodb.org/display/DOCS/GridFS).)
- [`Multer-gridfs-storage`](https://www.npmjs.com/package/multer-gridfs-storage) (You need this package to implement the MongoDB `GridFS` feature with `multer`).
- [`pdf-extract`](https://www.npmjs.com/package/pdf-extract) (Node PDF is a set of tools that takes in PDF files and converts them to usable formats for data 		    processing. The library supports both extracting text from searchable pdf files as well as performing OCR on pdfs  which are just scanned images of text.)
- [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) (Pure javascript cross-platform module to extract texts from PDFs.)
- [`stream-to-array`](https://www.npmjs.com/package/stream-to-array)  (Concatenate a readable stream's data into a single array. The data that we fetch from the database is in the form of a stream, it is necessary to buffer the data to convert the stream to PDF.)
- [`cors`](https://www.npmjs.com/package/cors) (CORS is a node.js package for providing a [`Connect`](http://www.senchalabs.org/connect/)/[`Express`](http://expressjs.com/) middleware that can be used to enable [`CORS`](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) with various options.)
- [`officegen`](https://www.npmjs.com/package/officegen) (Creating Office Open XML files (Word, Excel and Powerpoint) for Microsoft Office 2007 and later without external tools, just pure Javascript.)

#### Pdf-extract prerequisites:

- `pdftk`

  pdftk splits multi-page pdf into single pages.

- `pdftotext`

  pdftotext is used to extract text out of searchable pdf documents

- `ghostscript`

  ghostscript is an ocr preprocessor which convert pdfs to tif files for input into tesseract

- `tesseract`

  tesseract performs the actual ocr on your scanned images

More explanations for installing each of these packages on any operating system are written [`here`](https://www.npmjs.com/package/pdf-extract)
I have written these prerequisites in the docker file.

**Dockerfile**:

```dockerfile
FROM node:14
RUN apt update
RUN apt install -y pdftk poppler-utils ghostscript tesseract-ocr tesseract-ocr-fas
RUN apt autoclean && apt autoremove
RUN mkdir /app
WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
```

**NOTE** Install `tesseract-ocr-fas` for support *persian* language, Visit this [`Github project`](https://tesseract-ocr.github.io/tessdoc/Data-Files.html) for more information on using your preferred language.

`docker-compose.yml`:

```yaml
version: "3"
services:
  backend-file-server:
    image: file-server
    container_name: file-server-container
    build:
      context: .
    restart: on-failure
    volumes:
      - "./word/:/app/word/"
    depends_on: 
      - mongodb
    networks:
      - file-net
    ports: 
      - "3000:3000"
  mongodb:
    image: mongo:4.2
    container_name: mongodb
    restart: on-failure
    env_file: ./mongo_env
    volumes: 
      - ./mongo-data:/data/db
    networks:
      - file-net
  mongo-express:
    image: mongo-express:0.54.0
    container_name: mongo-express
    depends_on:
      - mongodb
    networks:
      - file-net
    env_file: ./mongo-express_env 
  nginx:
    image: nginx:1.21
    container_name: nginx_proxy
    restart: on-failure
    depends_on:
      - backend
    networks:
      - file-net
    ports:
      - "8080:8080"
      - "8081:8081"
    volumes:
      - ./conf.d/:/etc/nginx/conf.d/
networks:
  file-net:

```

