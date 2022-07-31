FROM node:14
RUN apt update
RUN apt install -y pdftk poppler-utils ghostscript tesseract-ocr tesseract-ocr-fas
# RUN cp "./share/eng.traineddata" "/usr/share/tesseract-ocr/tessdata/eng.traineddata"
# RUN cp "./share/configs/alphanumeric" "/usr/share/tesseract-ocr/tessdata/configs/alphanumeric"
RUN apt autoclean && apt autoremove
RUN mkdir /app
WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]