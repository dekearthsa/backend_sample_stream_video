const express = require("express");
const fs = require("fs");
const PORT = 7777
const app = express(); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/video", (req, res) => {
    const videoPath = "./files/video1.mov"
    const stat = fs.statSync(videoPath); // fs.statSync ดึงข้อมูลรายละเอียดไฟล์
    const fileSize = stat.size; 
    const range = req.headers.range; // ข้อมูล header ของ video ที่ร้องขอ
    console.log("range => ",range);
    const parts = range.replace(/bytes=/, "").split("-"); 
    console.log("parts => ",parts);
    const start = parseInt(parts[0]); 
    console.log("start => ", start);
    const end =  fileSize - 1;
    console.log("end => ", end);
    const chunkSize = end - start + 1; // start + 1 เพื่อให้จำนวนครบ
    console.log("chunkSize => ", chunkSize)
    const fileStream = fs.createReadStream(videoPath, { start, end }); // { start, end } ที่ต้องใส่ start, end เพื่อให้เราสามารถเลื่อน video ได้ 
    res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`, // กำหนดขนาดของข้อมูล โดย ด้านหน้าเป็นช่วงของ byte ณ เวลานึงถึง byte ช่วงจบ / byte ทั้งหมด
        "Accept-Ranges": "bytes", // ข้อมูลเป็น bytes
        "Content-Length": chunkSize, // ข้อมูล bytes ที่ server ที่ทางหน้าบ้านร้องขอมา
        "Content-Type": "video/mp4", // ข้อมูลที่ส่งไปเป็น video 
    });
    fileStream.on('data', (chunk) => {
        res.write(chunk); // ส่ง chunk ไปยัง client
    });
    fileStream.on('end', () => {
        console.log("Streaming finished");
        res.end(); // ปิดการเชื่อมต่อ
    });
});

app.listen(PORT, () => {
    console.log(`app listen to port http://localhost:${PORT}`)
})