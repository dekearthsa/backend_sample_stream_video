const express = require("express");
const fs = require("fs");
const PORT = 7777
const app = express(); 
app.use(express.urlencoded({ extended: true })); // 
app.use(express.json());

const CHUNK_SIZE = (5 * 1024) * 1024; // กำหนดการหั่นเพื่อส่ง stream ไปทุก ๆ 5 mb

app.get("/video", (req, res) => {
    const videoPath = "./files/video1.mov"
    const stat = fs.statSync(videoPath); // ใช้ fs.statSync เพื่อดูรายละเอียดของไฟล์ ในที่นี้เราจะใช้ size ขนาดของข้อมูล
    const fileSize = stat.size; 
    const range = req.headers.range; // เก็บตำแหน่งของ bytes ณ​ ปัจจุบันของทาง frontend 
    console.log("range => ",range);
    const parts = range.replace(/bytes=/, "").split("-");  // ช่วงข้อมูลของที่ video เล่นไปถึง ข้อมูลจะออกมาเป็น string แบบนี้ bytes=65536- ต้องทำการ clean 
    console.log("parts => ",parts);
    const start = parseInt(parts[0]); // ช่วงของ bytes ที่เรากด ข้อมูลจะมีรูปแบบ ['45435','']
    console.log("start => ", start);
    const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1); // บอกว่าตอนนี้กำลังขอข้อมูลในช่วงที่อยู่ภายใน 5MB ใช้ Math.min เพื่อให้มันใจว่าจะไม่เกินขนาดของไฟล์
    // ข้อมูลต้องลบออกไป -1 bytes เนื่องจาก ตำแหน่งการวาง bytes นั้นเป็น index
    console.log("end => ", end);
    const chunkSize = end - start + 1; // chunkSize + กลับไป 1 ส่วนนี้เรากำลังจะบอกหน้าบ้านว่า bytes ที่จะส่งไปมีจำนวนเท่าไหร่
    console.log("chunkSize => ", chunkSize)

    const readST = fs.createReadStream(videoPath, { start, end }); // กำหนดช่วงของข้อมูล {ช่อง bytes ที่เริ่มต้น, ช่วง bytes ที่สิ้นสุด} ถ้าไม่ใส่เราจะกดเลื่อน video ไม่ได้ 
    res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,  // กำหนดขนาดของข้อมูล โดย ด้านหน้าเป็นช่วงของ byte ณ เวลานึงถึง byte ช่วงจบ / byte ทั้งหมด
        "Accept-Ranges": "bytes",  // บอก frontend ให้รู้ว่า Server รองรับข้อมูลแบบ Byte Ranges
        "Content-Length": chunkSize, // ตรงนี้กำลังบอกถึงจำนวน bytes ที่เราจะ Stream ไปให้
        "Content-Type": "video/mp4", // บอกว่าประเภทข้อมูลคือไฟล์ video 
    });

    readST.on('data', (chunk) => {
        res.write(chunk); // ส่งไปเป็นทีล่ะส่วนตามที่กำหนดไว้
    });

    readST.on('end', () => {
        console.log("Streaming finished");
        res.end();  // อย่าลืมปิดเดะ API จะทำงานตลอดกาล
    });
});

app.listen(PORT, () => {
    console.log(`app listen to port http://localhost:${PORT}`)
})