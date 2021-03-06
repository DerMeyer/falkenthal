const express = require('express');
const app = express();
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 8080;

const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/falkenthal');

const { s3upload } = require('./s3');
const { s3Url } = require('./config');
const { MY_SECRET, SMTP_USER, SMTP_PASS, ADMIN_PASSWORD } = (process.env.NODE_ENV === 'production' && process.env) || require('./confidential.json');

const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');
const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, `${__dirname}/uploads`);
    },
    filename: function (req, file, callback) {
      uidSafe(24).then(function(uid) {
          callback(null, uid + path.extname(file.originalname));
      });
    }
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 4194304
    }
});

const cookieSession = require('cookie-session');
const cookieSessionMiddleware = cookieSession({
    secret: MY_SECRET,
    maxAge: 1000 * 60 * 60 * 24 * 14
});
app.use(cookieSessionMiddleware);

const compression = require('compression');
app.use(compression());

const bp = require('body-parser');
app.use(bp.json());

app.use(express.static(`${__dirname}/public`));

app.get('/is_admin', (req, res) => {
    if (req.session.admin) {
        res.json({
            admin: true
        });
    } else {
        res.json({
            admin: false
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.admin = false;
    res.json({
        success: true
    });
});

app.post('/login', (req, res) => {
    if (req.body.pw === ADMIN_PASSWORD) {
        req.session.admin = true;
        req.session.cookies = true;
        res.json({
            success: true
        });
    } else {
        res.json({
            success: false
        });
    }
});

app.get('/accept_cookies', (req, res) => {
    req.session.cookies = true;
    res.json({
        success: true
    });
});

app.get('/is_cookies', (req, res) => {
    if (req.session.cookies) {
        res.json({
            cookies: true
        });
    } else {
        res.json({
            cookies: false
        });
    }
});

app.post('/create_folder', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'INSERT INTO folders (position, name, description) VALUES ($1, $2, $3)',
            [req.body.position, req.body.name, req.body.description]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/rename_folder', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'UPDATE folders SET name = $1 WHERE id = $2',
            [req.body.name, req.body.id]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/delete_folder', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'DELETE FROM folders WHERE id = $1',
            [req.body.id]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/swap_folders', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'UPDATE folders SET position = $1 WHERE id = $2',
            [req.body.position_two, req.body.id_one]
        );
        await db.query(
            'UPDATE folders SET position = $1 WHERE id = $2',
            [req.body.position_one, req.body.id_two]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.get('/get_folders', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM folders ORDER BY position DESC'
        );
        res.json({
            success: true,
            folders: result.rows
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/set_title_image', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        const result = await db.query(
            'SELECT url FROM images WHERE id = $1',
            [req.body.id]
        );
        await db.query(
            'UPDATE folders SET title_image_url = $1 WHERE id = $2',
            [result.rows[0].url, req.body.folder_id]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/upload_image', uploader.single('file'), s3upload, async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    if (req.file) {
        try {
            const url = `${s3Url}${req.file.filename}`;
            const maxPosition = await db.query(
                'SELECT MAX(position) FROM images'
            );
            const position = maxPosition.rows[0].max + 1 || 1;
            await db.query(
                'INSERT INTO images (position, folder_id, url, description) VALUES ($1, $2, $3, $4)',
                [position, req.body.folder_id, url, req.body.description]
            );
            const hasTitleImage = await db.query(
                'SELECT title_image_url FROM folders WHERE id = $1',
                [req.body.folder_id]
            );
            if (!hasTitleImage.rows[0].title_image_url) {
                await db.query(
                    'UPDATE folders SET title_image_url = $1 WHERE id = $2',
                    [url, req.body.folder_id]
                );
            }
            res.json({
                success: true
            });
        } catch (err) {
            console.log(err);
            res.json({
                success: false,
                message: 'Beim Upload ist etwas schiefgelaufen.'
            });
        }
    } else {
        res.json({
            success: false,
            message: 'Sieht aus, als ob das Bild zu groß wär. Bist du unter 4MB? '
        });
    }
});

app.post('/change_image_folder', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        const result = await db.query(
            'SELECT id FROM folders WHERE name = $1',
            [req.body.name]
        );
        await db.query(
            'UPDATE images SET folder_id = $1 WHERE id = $2',
            [result.rows[0].id, req.body.id]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/delete_image', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'DELETE FROM images WHERE id = $1',
            [req.body.id]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/swap_images', async (req, res) => {
    if (!req.session.admin) {
        res.end();
    }
    try {
        await db.query(
            'UPDATE images SET position = $1 WHERE id = $2',
            [req.body.position_two, req.body.id_one]
        );
        await db.query(
            'UPDATE images SET position = $1 WHERE id = $2',
            [req.body.position_one, req.body.id_two]
        );
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/get_images', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM images WHERE folder_id = $1 ORDER BY position DESC',
            [req.body.id]
        );
        res.json({
            success: true,
            images: result.rows
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/get_title', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT name FROM folders WHERE id = $1',
            [req.body.id]
        );
        res.json({
            success: true,
            title: result.rows[0]
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.post('/send_mail', (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.1und1.de',
            port: 587,
            secure: false,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });
        const mailOptions = {
            from: req.body.mail,
            to: 'falkenthal.jens@gmail.com',
            subject: `Nachricht von ${req.body.sender}`,
            html: `<h2 style="color:gray">Hi Jens!</h2>
                   <h3 style="color:gray">${req.body.sender} hat Dir diese Nachricht von deiner Homepage geschickt:</h3>
                   <p style="white-space:pre-line">${req.body.text}</p>`
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(`Emailing didn't work. Here's the error:`, err);
                res.json({
                    success: false
                });
            } else {
                console.log('Emailing Success! Message ID at register:', info.messageId);
                res.json({
                    success: true
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

app.listen(PORT, () => console.log(`I'm listening on port ${PORT}`));
