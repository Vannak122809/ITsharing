import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "./src/r2.js";
import fs from "fs";

// create a dummy PDF
const pdfContent = `%PDF-1.4
%ÄÅÒÅ
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 21>> stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000015 00000 n
0000000060 00000 n
0000000111 00000 n
0000000199 00000 n
trailer <</Size 5/Root 1 0 R>>
startxref
269
%%EOF
`;

fs.writeFileSync("example.pdf", pdfContent);

const fileName = `documents/example-${Date.now()}.pdf`;

const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: fileName,
  Body: fs.readFileSync("example.pdf"),
  ContentType: "application/pdf",
});

async function run() {
  try {
    await r2Client.send(command);
    console.log("Uploaded to:", fileName);
    console.log("URL:", `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/${fileName}`);
  } catch (err) {
    console.error(err);
  }
}
run();
